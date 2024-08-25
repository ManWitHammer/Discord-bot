const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const Notice = require("../../models/notice.model")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setnotiсes')
        .setDescription('Даёт пользователю предупреждение')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers)
        .setDMPermission(false)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('Пользователь, которого нужно выгнать')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Причина предупреждения')
                .setRequired(false)
        ),

    run: async (client, interaction) => {
        // Проверка прав пользователя
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return interaction.reply({ content: 'У вас нет прав на кик пользователей.', ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'Не указана';

        if (!target) {
            return interaction.reply({ content: 'Этот пользователь не является участником сервера.', ephemeral: true });
        }

        console.log(target)

        if (target.bot) {
            return interaction.reply({ content: 'Нельзя давать предупреждения боту', ephemeral: true });
        }

        let notificationsData = await Notice.findOne({ guildId: interaction.guildId, userId: target.id })
        if (!notificationsData) {
            notificationsData = await Notice.create({
                guildId: interaction.guildId, 
                userId: target.id,
                username: target.username,
                notifications: [{
                    reason,
                    date: new Date()
                }]
            })
            const embedMessageToUser = new EmbedBuilder()
                .setTitle('Вы получили предупреждение')
                .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                .setDescription(`Вы получили предупреждение, по причине: ${reason}`)
                .setColor('Random');
            await target.send({ embeds: [embedMessageToUser] });

            const embedMessageToChannel = new EmbedBuilder()
                .setTitle('Пользователь получил предупреждение')
                .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                .setDescription(`Пользователь <@${target.id}> получил предупреждение, по причине: ${reason}`)
                .setColor('Random');
            return interaction.reply({ embeds: [embedMessageToChannel] });
        } else {
            notificationsData.notifications.push({
                reason,
                date: new Date()
            })
            await notificationsData.save()
            const embedMessageToUser = new EmbedBuilder()
                .setTitle('Вы получили предупреждение')
                .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                .setDescription(`Вы получили предупреждение, по причине: ${reason}`)
                .setColor('Random');
            await target.send({ embeds: [embedMessageToUser] });
            const embedMessageToChannel = new EmbedBuilder()
                .setTitle('Пользователь получил предупреждение')
                .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                .setDescription(`Пользователь <@${target.id}> получил предупреждение, по причине: ${reason}`)
                .setColor('Random');
            return interaction.reply({ embeds: [embedMessageToChannel] });
        }
    }
}