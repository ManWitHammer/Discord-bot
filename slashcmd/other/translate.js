const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const translate = require('@vitalets/google-translate-api'); // Импортируем библиотеку

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Переводит текст')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('Введите текст, который надо перевести')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('target_lang')
                .setDescription('Введите код языка перевода, например: ru, en, es и т.д.')
                .setRequired(true)
        ),

    run: async (client, interaction) => {
        const prompt = interaction.options.getString('prompt');
        const targetLang = interaction.options.getString('target_lang');

        if (prompt.length === 0) {
            return interaction.reply({ content: 'Введите текст для перевода', ephemeral: true });
        }

        if (targetLang.length !== 2) {
            return interaction.reply({ content: 'Некорректный формат кода языка', ephemeral: true });
        }

        // Используем метод translate через вызов translate.translate()
        translate.translate(prompt, { to: targetLang }).then(res => {
            const embedMessageToUser = new EmbedBuilder()
                .setTitle('Перевод')
                .setDescription(`**${res.text}**`)
                .setColor('Random');
            interaction.reply({ embeds: [embedMessageToUser], ephemeral: true });
        }).catch(err => {
            console.error(err);
            interaction.reply({ content: 'Произошла ошибка при переводе текста', ephemeral: true });
        });
    }
};