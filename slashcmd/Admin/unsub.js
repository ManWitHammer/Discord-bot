const { SlashCommandBuilder } = require('@discordjs/builders')
const { PermissionsBitField } = require('discord.js') 
const Subscription = require('../../models/sub.model.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unsub')
        .setDescription('Отписаться от уведомлений о стримах и видео. Только администраторы могут использовать эту команду.')
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName('platform')
                .setDescription('Выберите платформу')
                .setRequired(true)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    { name: 'Twitch', value: 'twitch' }
                ))
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Имя пользователя Twitch или YouTube')
                .setRequired(true)),

    run: async (client, interaction) => {
        const platform = interaction.options.getString('platform')
        const username = interaction.options.getString('username')
        const guildId = interaction.guildId

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Эта команда доступна только администраторам!', ephemeral: true })
        }

        // Определяем критерии поиска подписки по выбранной платформе
        let querydepcheck
        if (platform === 'twitch') {
            query = { twitchUsername: username, guildId }
        } else if (platform === 'youtube') {
            query = { youtubeChannelName: username, guildId }
        }

        // Проверяем, существует ли уже подписка на этого пользователя и платформу
        const subscription = await Subscription.findOne(query)

        if (!subscription) {
            return interaction.reply({ content: `Вы не подписаны на уведомления от ${username} на платформе ${platform}.`, ephemeral: true })
        }

        // Удаляем подписку
        const res = await Subscription.deleteOne(query)
        if (!res) {
            return interaction.reply({ content: `Не удалось отписаться от уведомлений от ${username} на платформе ${platform}.`, ephemeral: true })
        }
        interaction.reply({ content: `Вы успешно отписались от уведомлений от ${username} на платформе ${platform}.`, ephemeral: true })
    }
}