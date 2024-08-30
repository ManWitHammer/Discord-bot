const { SlashCommandBuilder } = require('@discordjs/builders');
const BadWords = require('../../models/badWords.model.js');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delbadwords')
        .setDescription('Удаляет плохие слова из списка')
        .addStringOption(option => 
            option.setName('badword')
                .setDescription('Выберите плохое слово для удаления')
                .setRequired(true)),

    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Эта команда доступна только администраторам!', ephemeral: true });
        }

        const word = interaction.options.getString('badword')
        const guildId = interaction.guildId;

        let badWordsEntry = await BadWords.findOne({ guildId });

        if (badWordsEntry) {
            if (badWordsEntry.badWords.includes(word)) {
                    badWordsEntry.badWords = badWordsEntry.badWords.filter(w => w !== word);
                    await badWordsEntry.save();
                    return interaction.reply({ content: `Слово "${word}" было успешно удалено из списка плохих слов.`, ephemeral: true });
            } else {
                return interaction.reply({ content: `Слово "${word}" не найдено в списке плохих слов.`, ephemeral: true });
            }
        } else {
            return interaction.reply({ content: `Слово "${word}" не найдено в списке плохих слов.`, ephemeral: true });
        }
    }
};