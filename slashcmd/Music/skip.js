const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice'); 
const Queue = require('../../models/queue.model');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Пропустить определенное количество треков')
        .setDMPermission(false)
        .addIntegerOption(option => 
            option.setName('count')
                .setDescription('Количество треков для пропуска')
                .setRequired(false)  // Параметр стал необязательным
        ),

    run: async (client, interaction) => {
        const guildId = interaction.guildId;
        const voiceChannelId = interaction.member.voice.channelId;
        const queueData = await Queue.findOne({ guildId, voiceChannelId })
        // Получаем значение count или устанавливаем его в 1 по умолчанию
        const count = interaction.options.getInteger('count') || 1;

        // Получаем текущее соединение
        const connection = getVoiceConnection(interaction.guild.id);
        if (!connection) {
            return interaction.reply({ content: 'Нет активного воспроизведения для паузы.', ephemeral: true });
        }

        const player = connection.state?.subscription?.player;
        if (!player) {
            return interaction.reply({ content: 'Сейчас ничего не воспроизводится.', ephemeral: true });
        }

        if (count > queueData.queue.length) {
            // Очищаем очередь
            queueData.queue = [];
            await queueData.save();
            if (player.state.status === 'paused') {
                player.unpause(); // Продолжает воспроизведение
            }
            player.stop(); // Принудительно останавливаем плеер без перехода в состояние Idle
            return interaction.reply('Все треки пропущены. Покидаю голосовой канал.');
        } else {
            // Удаляем указанное количество треков из очереди
            queueData.queue.splice(0, count - 1);
            await queueData.save()
            if (player.state.status === 'paused') {
                return interaction.reply({ content: 'Трек сейчас на паузе, пропиши /resume, чтобы продолжить трек', ephemeral: true })
            }
            // Останавливаем текущий трек, что вызовет воспроизведение следующего
            player.stop();

            return interaction.reply(`Пропустил ${count} трек(а/ов). Воспроизвожу следующий.`);
        }
    }
}