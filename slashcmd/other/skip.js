const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice'); 
let queue = require('./play').queue;

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

        if (!queue || queue.length === 0) {
            console.log(interaction.guild.id)
            player.stop();
            return interaction.reply({ content: 'В очереди нет треков для пропуска.', ephemeral: true });
        }

        if (count >= queue.length) {
            // Очищаем очередь и останавливаем плеер
            queue.length = 0;
            player.stop();

            // Отключаемся от голосового канала
            connection.destroy();

            return interaction.reply({ content: 'Все треки пропущены. Покидаю голосовой канал.', ephemeral: true });
        } else {
            // Удаляем указанное количество треков из очереди
            queue.splice(0, count - 1);

            // Останавливаем текущий трек, что вызовет воспроизведение следующего
            player.stop();

            return interaction.reply({ content: `Пропустил ${count} трек(а/ов). Воспроизвожу следующий.`, ephemeral: true });
        }
    }
}