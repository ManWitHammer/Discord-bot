const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js'); 
const Subscription = require('../../models/sub.model.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sub')
        .setDescription('Подписаться на уведомления о стримах Twitch, увы только админы могут этим пользоватся')
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName('twitchuser')
                .setDescription('Имя пользователя Twitch')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Канал Discord для отправки уведомлений')
                .setRequired(true)),

    run: async (client, interaction) => {
        const twitchUsername = interaction.options.getString('twitchuser');
        const discordChannel = interaction.options.getChannel('channel');
        const guildId = interaction.guildId;

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Эта команда доступна только администраторам!', ephemeral: true });
        }

        // Проверяем, существует ли уже подписка на этого пользователя и канал
        let subscription = await Subscription.findOne({ twitchUsername, discordChannelId: discordChannel.id });

        if (subscription) {
            return interaction.reply({ content: `Вы уже подписаны на уведомления о стримах ${twitchUsername} в канале ${discordChannel}.`, ephemeral: true });
        }

        // Сохраняем новую подписку
        subscription = new Subscription({
            twitchUsername,
            discordChannelId: discordChannel.id,
            guildId
        });

        await subscription.save();
        interaction.reply({ content: `Вы успешно подписались на уведомления о стримах ${twitchUsername} в канале ${discordChannel}.`, ephemeral: true });
    }
};