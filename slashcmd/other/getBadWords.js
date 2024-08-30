const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const BadWords = require('../../models/badWords.model.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badwords')
        .setDescription('Показывает все установленные плохие слова для этого сервера'),

    run: async (client, interaction) => {
        const guildId = interaction.guildId;

        let badWordsEntry = await BadWords.findOne({ guildId });

        if (!badWordsEntry || badWordsEntry.badWords.length === 0) {
            return interaction.reply({ content: "Список плохих слов отсутствует", ephemeral: true });
        } else {
            const badWordsList = badWordsEntry.badWords.map((badWord, index) => `${index + 1}. ${badWord}`).join('\n');
            
            const badWordsEmbed = new EmbedBuilder()
                .setTitle('Список плохих слов')
                .setColor('Random')
                .setDescription(badWordsList);

            await interaction.reply({ embeds: [badWordsEmbed], ephemeral: true });
        }
    }
};