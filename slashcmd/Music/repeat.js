const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice'); 
const Queue = require('../../models/queue.model');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('repeat')
        .setDescription('Ставит трек, который играет сейчас в начало очереди')
        .setDMPermission(false),

    run: async (client, interaction) => {
        const guildId = interaction.guildId;
        const voiceConnection = getVoiceConnection(interaction.guild.id);

        if (!voiceConnection) {
            return interaction.reply({ content: 'Бот не находится в голосовом канале.', ephemeral: true });
        }

        const voiceChannelId = voiceConnection.joinConfig.channelId;
        const queueData = await Queue.findOne({ guildId, voiceChannelId })
        if (!queueData.nowPlaying) {
            return interaction.reply({ content: 'Сейчас ничего не воспроизводится. Как ты вызвал команду?', ephemeral: true });
        }
        queueData.queue.unshift(queueData.nowPlaying);
        await queueData.save();

        return interaction.reply({ content: 'Этот трек будет следующим в очереди', ephemeral: true });
    }
}