const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice'); 
const Queue = require('../../models/queue.model');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Перетасовать треки в очереди')
        .setDMPermission(false),

    run: async (client, interaction) => {
        const guildId = interaction.guildId;
        const voiceConnection = getVoiceConnection(interaction.guild.id);

        if (!voiceConnection) {
            return interaction.reply({ content: 'Бот не находится в голосовом канале.', ephemeral: true });
        }

        const voiceChannelId = voiceConnection.joinConfig.channelId;
        let queueEntry = await Queue.findOne({ guildId, voiceChannelId });

        if (!queueEntry || queueEntry.queue.length === 0) {
            return interaction.reply({ content: 'Очередь пуста или не найдена.', ephemeral: true });
        }

        // Перемешиваем треки
        queueEntry.queue = shuffle(queueEntry.queue);

        // Сохраняем изменения
        await queueEntry.save();

        interaction.reply({ content: 'Очередь была успешно перетасована!', ephemeral: true });
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}