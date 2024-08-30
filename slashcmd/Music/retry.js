const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice'); 
const Queue = require('../../models/queue.model');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('retry')
        .setDescription('Производит повтор трека, который играет сейчас')
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

        const player = voiceConnection.state?.subscription?.player;
        if (!player) {
            return interaction.reply({ content: 'Сейчас ничего не воспроизводится.', ephemeral: true });
        }

        queueData.queue.unshift(queueData.nowPlaying);
        await queueData.save();
        player.stop();

        return interaction.reply('Этот трек воспроизведён заново.');
    }
}