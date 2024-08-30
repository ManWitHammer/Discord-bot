const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js'); 
const Subscription = require('../../models/sub.model.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unsub')
        .setDescription('Отписаться от уведомлений о стримах Twitch, увы только админы могут этим пользоватся')
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName('twitchuser')
                .setDescription('Имя пользователя Twitch')
                .setRequired(true)),

    run: async (client, interaction) => {
        const twitchUsername = interaction.options.getString('twitchuser');
        const discordChannel = interaction.options.getChannel('channel');
        const guildId = interaction.guildId;

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Эта команда доступна только администраторам!', ephemeral: true });
        }

        // Проверяем, существует ли уже подписка на этого пользователя и канал
        let subscription = await Subscription.findOne({ twitchUsername, guildId });

        if (!subscription) {
            return interaction.reply({ content: `Вы не подписаны на уведомления о стримах ${twitchUsername}.`, ephemeral: true });
        }

        // Сохраняем новую подписку
        const res = await Subscription.deleteOne({ twitchUsername, guildId })
        if (!res) {
            return interaction.reply({ content: `Не удалось отписаться от уведомлений о стримах ${twitchUsername} в канале ${discordChannel}.`, ephemeral: true });
        }
        interaction.reply({ content: `Вы успешно отписались от уведомлений о стримах ${twitchUsername}.`, ephemeral: true });
    }
};