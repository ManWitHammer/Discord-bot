const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Снимает мут с пользователя')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Пользователь, у которого нужно снять мут')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Причина снятия мута')
                .setRequired(false)
        ),

    run: async (client, interaction) => {
        // Проверка прав пользователя
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return interaction.reply({ content: 'У вас нет прав на управление мутацией пользователей.', ephemeral: true });
        }

        // Получаем указанного пользователя и причину
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'Не указана';

        if (!target) {
            return interaction.reply({ content: 'Этот пользователь не является участником сервера.', ephemeral: true });
        }

        // Проверяем, есть ли у пользователя мут
        if (!target.isCommunicationDisabled()) {
            return interaction.reply({ content: 'Этот пользователь не замучен.', ephemeral: true });
        }

        // Снимаем мут
        try {
            await target.timeout(null, reason);

            // Отправляем личное сообщение с причиной снятия мута
            try {
                const embedMessageToUser = new EmbedBuilder()
                    .setTitle('Мут снят')
                    .setDescription(`Ваш мут был снят на сервере **${interaction.guild.name}**. Причина: **${reason}**`)
                    .setColor('Random');
                await target.send({ embeds: [embedMessageToUser] });
            } catch (error) {
                console.error(`Не удалось отправить сообщение ${target.user.username}: ${error}`);
            }

            // Сообщение об успешном снятии мута в канал
            const embedMessageToChannel = new EmbedBuilder()
                .setTitle('Мут снят')
                .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                .setDescription(`Пользователь <@${target.user.id}> был размучен. Причина: **${reason}**`)
                .setColor('Random');
            return interaction.reply({ embeds: [embedMessageToChannel] });

        } catch (error) {
            console.error(`Не удалось снять мут с ${target.user.username}: ${error}`);
            return interaction.reply({ content: `Не удалось снять мут с ${target.user.username}.`, ephemeral: true });
        }
    }
};