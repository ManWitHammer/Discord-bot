const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');
const Queue = require('../../models/queue.model'); // Используется та же Map, что и для playNextTrack

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Продолжает воспроизведение остановленного трека.'),
    
    run: async (client, interaction) => {
        const guildId = interaction.guild.id;
        const connectionData = getVoiceConnection(guildId);
        
        if (!connectionData) {
            return interaction.reply({ content: 'Нет активного воспроизведения для паузы.', ephemeral: true });
        }

        const player = connectionData.state?.subscription?.player;
        const playerState = player.state.status;

        if (playerState === 'paused') {
            player.unpause(); // Продолжает воспроизведение
            return interaction.reply('Воспроизведение возобновлено.');
        } else {
            return interaction.reply({ content: 'Воспроизведение не было остановлено.', ephemeral: true });
        }
    },
};