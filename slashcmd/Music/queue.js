const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice'); 
const Queue = require('../../models/queue.model');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Показывает очередь с треков')
        .setDMPermission(false),

    run: async (client, interaction) => {
        const guildId = interaction.guildId;
        const voiceConnection = getVoiceConnection(interaction.guild.id);

        if (!voiceConnection) {
            return interaction.reply({ content: 'Бот не находится в голосовом канале.', ephemeral: true });
        }

        const voiceChannelId = voiceConnection.joinConfig.channelId;

        const queueData = await Queue.findOne({ guildId, voiceChannelId })
        if (queueData.queue.length == 0) {
            await interaction.reply({ content: `Сейчас нет ни одного трека в очереди`, ephemeral: true });
        } else {
            const queueEmbed = new EmbedBuilder()
                .setTitle('Очередь воспроизведения') 
                .setColor('Random');

            // Добавляем каждый трек в embed
            queueData.queue.forEach((track, index) => {
                queueEmbed.addFields(
                    { name: `${index + 1}. ${track.title}`, value: `[Вот трек](${track.url})` }
                );
            })
            await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
        }
    }
}