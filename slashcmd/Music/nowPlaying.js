const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice'); 
const Queue = require('../../models/queue.model');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Что же играет в данный момент?')
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
            return interaction.reply({ content: 'Сейчас ничего не воспроизводится, странно... Как ты вызвал команду?', ephemeral: true });
        }
        const queueEmbed = new EmbedBuilder()
            .setTitle('Сейчас играет...') 
            .addFields(
                { name: `${queueData.nowPlaying.title}`, value: `[Вот трек](${queueData.nowPlaying.url})` }
            )
            .setColor('Random')

        await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
    }
}