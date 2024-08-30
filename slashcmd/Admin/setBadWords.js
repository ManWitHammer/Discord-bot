const { SlashCommandBuilder } = require('@discordjs/builders');
const BadWords = require('../../models/badWords.model.js');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbadwords')
        .setDescription('Устанавливает плохие слова для этого сервера (разделенные запятыми)')
        .addStringOption(option => 
            option.setName('words')
                .setDescription('Список плохих слов, разделенных запятыми и пробелами')
                .setRequired(true)),

    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Эта команда доступна только администраторам!', ephemeral: true });
        }

        const words = interaction.options.getString('words').trim();
        const wordList = words.split(',').map(word => word.trim());
        const guildId = interaction.guildId;

        let badWordsEntry = await BadWords.findOne({ guildId });

        if (badWordsEntry) {
            wordList.forEach(word => {
                if (!badWordsEntry.badWords.includes(word)) {
                    badWordsEntry.badWords.push(word);
                }
            });
            badWordsEntry.badWords;
        } else {
            badWordsEntry = new BadWords({
                guildId,
                badWords: wordList
            });
        }

        await badWordsEntry.save();
        interaction.reply({ content: 'Плохие слова были успешно обновлены!', ephemeral: true });
    }
};