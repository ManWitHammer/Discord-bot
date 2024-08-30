const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const Queue = require('../../models/queue.model'); // Используется та же Map, что и для playNextTrack

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Ставит текущий трек на паузу.'),
    
    run: async (client, interaction) => {
        const guildId = interaction.guild.id;
        const voiceChannelId = interaction.member.voice.channelId;
        const connectionData = getVoiceConnection(interaction.guild.id);
        
        if (!connectionData) {
            return interaction.reply({ content: 'Нет активного воспроизведения для паузы.', ephemeral: true });
        }

        const player = connectionData.state?.subscription?.player;
        const playerState = player.state.status;

        if (playerState === 'playing') {
            player.pause(); // Ставит плеер на паузу
            return interaction.reply('Воспроизведение приостановлено.');
        } else if (playerState === 'paused') {
            return interaction.reply('Трек уже на паузе.');
        } else {
            return interaction.reply('Нет активного воспроизведения для паузы.');
        }
    },
};