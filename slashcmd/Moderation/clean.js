const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clean')
        .setDescription('Удаляет указанное количество сообщений')
        .setDMPermission(false)
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Количество сообщений для удаления')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Пользователь, сообщения которого нужно удалить')),

    run: async (client, interaction) => {
        const count = interaction.options.getInteger('count');
        const user = interaction.options.getUser('user');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'У вас нет прав для использования этой команды.', ephemeral: true });
        }

        if (count < 1 || count > 100) {
            return interaction.reply({ content: 'Количество сообщений должно быть от 1 до 100.', ephemeral: true });
        }

        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        let messagesToDelete;

        if (user) {
            messagesToDelete = messages.filter(msg => msg.author.id === user.id).first(count);
        } else {
            messagesToDelete = messages.first(count);
        }

        await interaction.channel.bulkDelete(messagesToDelete, true)
            .then(deleted => interaction.reply({ content: `Удалено ${deleted.size} сообщений.`, ephemeral: true }))
            .catch(error => interaction.reply({ content: `Ошибка при удалении сообщений: ${error.message}`, ephemeral: true }));
    },
};