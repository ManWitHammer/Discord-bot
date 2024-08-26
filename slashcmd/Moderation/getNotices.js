const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const Notice = require("../../models/notice.model")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notiсes')
        .setDescription('Показывает все твои предупреждения')
        .setDMPermission(false)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('Показывает предупреждения пользователя')
                .setRequired(false)
        ),

    run: async (client, interaction) => {
        const target = interaction.options.getMember('target')

        if (target && !interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return interaction.reply({ content: 'У вас нет прав чтобы смотреть чужие предупреждения.', ephemeral: true });
        }

        if (!target) {
            let notificationsData = await Notice.findOne({ guildId: interaction.guildId, userId: interaction.user.id })
            if (!notificationsData) {
                notificationsData = await Notice.create({
                    guildId: interaction.guildId, 
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    notifications: []
                })
                return interaction.reply({ content: 'У вас нету ни одного предупреждения в этом канале! Продолжайте в том же духе.', ephemeral: true })
            }
            else if (notificationsData.notifications.length == 0) {
                return interaction.reply({ content: 'У вас нету ни одного предупреждения в этом канале! Продолжайте в том же духе.', ephemeral: true })
            }
            else {
                const queueEmbed = new EmbedBuilder()
                    .setTitle('Ваши предупреждения...') 
                    .setColor('Random');

                // Добавляем каждый трек в embed
                notificationsData.notifications.forEach((notification, index) => {
                    queueEmbed.addFields(
                        { name: `${index + 1}. По причине: ${notification.reason}`, value: `Дата создания: ${new Date(notification.date).toLocaleString()}, его ID ${notification._id}` }
                    );
                })
                await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
            }
        } else {
            if (target.user.bot) {
                return interaction.reply({ content: 'Нельзя смотреть предупреждения у бота', ephemeral: true });
            }

            let notificationsData = await Notice.findOne({ guildId: interaction.guildId, userId: target.user.id })
            if (!notificationsData) {
                notificationsData = await Notice.create({
                    guildId: interaction.guildId, 
                    userId: target.user.id,
                    username: target.user.username,
                    notifications: []
                })
                return interaction.reply({ content: `У <@${target.user.id}> нет ни одного предупреждения в этом канале!`, ephemeral: true })
            }
            else if (notificationsData.notifications.length == 0) {
                return interaction.reply({ content: `У <@${target.user.id}> нет ни одного предупреждения в этом канале!`, ephemeral: true })
            }
            else {
                const queueEmbed = new EmbedBuilder()
                    .setTitle(`<@${target.user.id}> предупреждения...`) 
                    .setColor('Random');

                // Добавляем каждый трек в embed
                notificationsData.notifications.forEach((notification, index) => {
                    queueEmbed.addFields(
                        { name: `${index + 1}. По причине: ${notification.reason}`, value: `Дата создания: ${new Date(notification.date).toLocaleString()}, его ID ${notification._id}` }
                    );
                })
                await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
            }
        }        
    }
}