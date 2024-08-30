const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const Notice = require("../../models/notice.model")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delwarn')
        .setDescription('Удаляет пользователю предупреждение')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers)
        .setDMPermission(false)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('Пользователь, у которого нужно удалить предупреждение')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('id')
                .setDescription('айди предупреждения')
                .setRequired(true)
        ),

    run: async (client, interaction) => {
        // Проверка прав пользователя
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return interaction.reply({ content: 'У вас нет прав на удаления предупреждения у пользователя.', ephemeral: true });
        }

        const target = interaction.options.getUser('target')
        const id = interaction.options.getString('id')

        if (!target) {
            return interaction.reply({ content: 'Этот пользователь не является участником сервера.', ephemeral: true });
        }

        if (target.bot) {
            return interaction.reply({ content: 'У бота нет предупреждений', ephemeral: true });
        }

        let notificationsData = await Notice.findOne({ guildId: interaction.guildId, userId: target.id })
        const finedNotification = notificationsData.notifications.find(el => el._id == id)
        if (finedNotification == undefined) {
            return interaction.reply({ content: 'некорректный айди', ephemeral: true })
        }
        
        notificationsData.notifications = notificationsData.notifications.filter(el => el._id != id)
        await notificationsData.save()

        target.send({ content: `Вам снял предупреждение он - <@${target.id}>` })

        return interaction.reply({ content: `<@${interaction.user.id}> снял предупреждение у пользователя <@${target.id}>` });
    }
}