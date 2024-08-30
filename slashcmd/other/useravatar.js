const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`useravatar`)
        .setDescription(`Показывает аватарку определённого пользователя на сервере`)
        .setDMPermission(false)
        .addUserOption(option => option.setName('user').setDescription('Пользователь для показа аватара').setRequired(false)),

    run: async (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user; // Если пользователь не упомянут, используем текущего пользователя
        const avatarURL = user.displayAvatarURL({ size: 1024, dynamic: true });

        const embed = new EmbedBuilder()
            .setTitle(`${user.username == "loloshara228" ? "(Никита Сигма)" : user.username + "'s"} Avatar `)
            .setImage(avatarURL)
            .setColor("Random")

        // Отправляем сообщение в канал
        await interaction.reply({ embeds: [embed] });
    }
};