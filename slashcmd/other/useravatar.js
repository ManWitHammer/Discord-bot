const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`useravatar`)
        .setDescription(`Показывает аватарку определённого пользователя на сервере. Пример команды: /useravatar @хэп`)
        .addUserOption(option => option.setName('user').setDescription('Пользователь для показа аватара')),

    run: async (client, interaction) => {
        // Получаем упомянутого пользователя из опции
        const user = interaction.options.getUser('user') || interaction.user; // Если пользователь не упомянут, используем текущего пользователя

        // Получаем URL аватара
        const avatarURL = user.displayAvatarURL({ size: 1024, dynamic: true });

        // Создаем сообщение с аватаром
        const embed = new EmbedBuilder()
            .setTitle(`${user.username == "loloshara228" ? "(Никита Сигма)" : user.username + "'s"} Avatar `)
            .setImage(avatarURL)
            .setColor("Random")

        // Отправляем сообщение в канал
        await interaction.reply({ embeds: [embed] });
    }
};