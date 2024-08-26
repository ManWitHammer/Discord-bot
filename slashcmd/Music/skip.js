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
            return interaction.reply({ content: 'Я не подключен к голосовому каналу.', ephemeral: true });
        }

        const player = connection.state?.subscription?.player;
        if (!player) {
            return interaction.reply({ content: 'Сейчас ничего не воспроизводится.', ephemeral: true });
        }

        if (count > queueData.queue.length) {
            // Очищаем очередь
            queueData.queue = [];
            await queueData.save();

            player.stop(); // Принудительно останавливаем плеер без перехода в состояние Idle
            return interaction.reply({ content: 'Все треки пропущены. Покидаю голосовой канал.', ephemeral: true });
        } else {
            // Удаляем указанное количество треков из очереди
            queueData.queue.splice(0, count - 1);
            await queueData.save()
            // Останавливаем текущий трек, что вызовет воспроизведение следующего
            player.stop();

            return interaction.reply({ content: `Пропустил ${count} трек(а/ов). Воспроизвожу следующий.`, ephemeral: true });
        }
    }
}