const { SlashCommandBuilder } = require('@discordjs/builders')
const { PermissionsBitField } = require('discord.js') 
const Subscription = require('../../models/sub.model.js')
const axios = require("axios")
require("dotenv/config")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sub')
        .setDescription('Подписаться на уведомления о стримах Twitch, увы только админы могут этим пользоватся')
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
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Канал Discord для отправки уведомлений')
                .setRequired(true)),

    run: async (client, interaction) => {
        const username = interaction.options.getString('username')
        const discordChannel = interaction.options.getChannel('channel')
        const platform = interaction.options.getString('platform')
        const guildId = interaction.guildId
        const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID
        const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET
        const YOUTUBE_API_KEY = process.env.GOOGLE_API_KEY

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Эта команда доступна только администраторам!', ephemeral: true })
        }
        if (platform == "twitch") {
            async function getTwitchAccessToken() {
                const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
                    params: {
                        client_id: TWITCH_CLIENT_ID,
                        client_secret: TWITCH_CLIENT_SECRET,
                        grant_type: 'client_credentials'
                    }
                })
                return response.data.access_token
            }
    
            const oauthToken = await getTwitchAccessToken()
    
            const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
                method: 'GET',
                headers: {
                    'Client-ID': TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${oauthToken}`
                }
            })
    
            if (!userResponse.ok) {
                return interaction.reply({ content: 'Такой пользователь не найден', ephemeral: true })
            }
    
            const userData = await userResponse.json()
            if (userData.data.length === 0) {
                return interaction.reply({ content: 'Такой пользователь не найден', ephemeral: true })
            }
    
            let subscription = await Subscription.findOne({ twitchUsername: username, discordChannelId: discordChannel.id })
    
            if (subscription) {
                return interaction.reply({ content: `Вы уже подписаны на уведомления о стримах ${username} в канале ${discordChannel}.`, ephemeral: true })
            }
    
            // Сохраняем новую подписку
            subscription = new Subscription({
                twitchUsername: username,
                discordChannelId: discordChannel.id,
                guildId,
                lastStreamId: null
            })
    
            await subscription.save()
            interaction.reply({ content: `Вы успешно подписались на уведомления о стримах ${username} в канале ${discordChannel}.`, ephemeral: true })
        } else if (platform === "youtube") {
            // YouTube subscription code
            const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    q: username,
                    type: 'channel',
                    maxResults: 1,
                    key: YOUTUBE_API_KEY
                }
            })

            const channelData = channelResponse.data.items[0]
            if (!channelData) {
                return interaction.reply({ content: 'Такой YouTube канал не найден', ephemeral: true })
            }

            const youtubeChannelId = channelData.id.channelId
            const youtubeChannelName = channelData.snippet.channelTitle

            let subscription = await Subscription.findOne({ youtubeChannelId, discordChannelId: discordChannel.id })

            if (subscription) {
                return interaction.reply({ content: `Вы уже подписаны на уведомления о новых видео на канале ${youtubeChannelName} в канале ${discordChannel}.`, ephemeral: true })
            }

            // Сохраняем новую подписку
            subscription = new Subscription({
                youtubeChannelId,
                youtubeChannelName,
                discordChannelId: discordChannel.id,
                guildId,
                lastVideoId: null
            })

            await subscription.save()
            interaction.reply({ content: `Вы успешно подписались на уведомления о новых видео на канале ${youtubeChannelName} в канале ${discordChannel}.`, ephemeral: true })
        }
    }
}