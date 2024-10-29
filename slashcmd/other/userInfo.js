const { SlashCommandBuilder } = require('@discordjs/builders')
const { EmbedBuilder } = require("discord.js")
const axios = require("axios")
require("dotenv/config")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Получить данные о пользователе с выбранной платформы')
        .addStringOption(option => 
            option.setName('платформа')
                .setDescription('Выберите платформу')
                .setRequired(true)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    { name: 'Twitch', value: 'twitch' },
                    { name: 'Steam', value: 'steam' },
                ))
        .addStringOption(option => 
            option.setName('никнейм')
                .setDescription('Введите никнейм пользователя, для стима айди пользователя')
                .setRequired(true)),
    
    async run(client, interaction) {
        const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID
        const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET
        const platform = interaction.options.getString('платформа')
        let username = interaction.options.getString('никнейм')

        if (platform === 'youtube') {
            const apiKey = process.env.GOOGLE_API_KEY;

        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                if (data.items.length > 0) {
                    const channelId = data.items[0].id.channelId;
                    return fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`);
                } else {
                    return Promise.reject('UserNotFound'); // Reject with a custom message if the user is not found
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.items.length > 0) {
                    const channelInfo = data.items[0];
                    const embedMessage = new EmbedBuilder()
                        .setAuthor({
                            name: channelInfo.snippet.customUrl,
                            iconURL: channelInfo.snippet.thumbnails.high.url
                        })
                        .setTitle(channelInfo.snippet.title)
                        .setDescription(channelInfo.snippet.description || "Отсуствует")
                        .setColor("Red")
                        .addFields(
                            { name: "Профиль:", value: `[Вот он](https://www.youtube.com/${channelInfo.snippet.customUrl})`, inline: true },
                            { name: "Дата создания:", value: new Date(channelInfo.snippet.publishedAt).toLocaleString(), inline: true },
                            { name: "Количество просмотров:", value: channelInfo.statistics.viewCount, inline: false },
                            { name: "Количество подписчиков:", value: channelInfo.statistics.subscriberCount, inline: false },
                        );

                    if (!channelInfo.statistics.hiddenSubscriberCount) {
                        embedMessage.addFields({ name: "Количество видео:", value: channelInfo.statistics.videoCount, inline: false });
                    }

                    return interaction.reply({ embeds: [embedMessage] });
                } else {
                    throw new Error('UserNotFound');
                }
            })
            .catch(error => {
                if (error === 'UserNotFound') {
                    return interaction.reply({ content: 'Такой пользователь не найден', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'Увы, что-то пошло не так :(', ephemeral: true });
                }
            });

        } else if (platform === 'twitch') {
            async function getTwitchAccessToken() {
                const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
                    params: {
                        client_id: TWITCH_CLIENT_ID,
                        client_secret: TWITCH_CLIENT_SECRET,
                        grant_type: 'client_credentials'
                    }
                });
                oauthToken = response.data.access_token;
                return response.data.access_token;
            }
            fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
                method: 'GET',
                headers: {
                    'Client-ID': TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${await getTwitchAccessToken()}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.data[0]) {
                    const profile = data.data[0]
                    const embedMessage = new EmbedBuilder()
                    .setAuthor({ name: profile.display_name, iconURL: profile.profile_image_url })
                    .setTitle(profile.broadcaster_type)
                    .setDescription(profile.description !== "" ? profile.description : "Отсуствует")
                    .setColor("Purple")
                    .setThumbnail(profile.offline_image_url)
                    .addFields(
                        { name: "Профиль:", value: `[Вот он](https://twitch.tv/${profile.login})`, inline: true }, 
                        { name: "Дата создания:", value: new Date(profile.created_at).toLocaleString(), inline: true }
                    )
                    
                    return interaction.reply({ embeds: [embedMessage] });
                } else {
                    return interaction.reply({ content: 'Произошла ошибка при получении информации', ephemeral: true });
                }
            })
            .catch(() => {
                return interaction.reply({ content: 'Такой пользователь не найден', ephemeral: true });
            })

        } else if (platform === 'steam') {
            if (isNaN(Number(username))) {
                try {
                    const response = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_KEY}&vanityurl=${username}`);
                    const data = await response.json();
            
                    if (data.response.success !== 1) {
                        return interaction.reply({ content: 'Невалидное имя пользователя стим', ephemeral: true });
                    }
            
                    username = data.response.steamid; // Здесь мы обновляем username на steamid
                } catch (err) {
                    return interaction.reply({ content: 'Произошла ошибка при получении информации', ephemeral: true })
                }
            }
            await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_KEY}&steamids=${username}`)
            .then(response => response.json())
            .then(data => {
                if (!data.response.players[0]) {
                    return interaction.reply({ content: 'Пользователь с таким айди не найден', ephemeral: true });
                }

                let profile = data.response.players[0];
                console.log(profile);
                // Check if profile.avatar exists before using it
                let avatarUrl = profile.avatar || 'default_avatar_url.png'; // Fallback to a default URL if necessary

                const embedMessage = new EmbedBuilder()
                    .setTitle(`${
                        profile.personastate === 0 ? "Не в сети" :
                        profile.personastate === 1 ? "В сети" :
                        profile.personastate === 2 ? "Занят" :
                        profile.personastate === 3 ? "Не на месте" :
                        profile.personastate === 4 ? "Вздремнул" : "Неизвестно"
                    }` + " " + `${profile.loccountrycode ? ":flag_" + profile.loccountrycode.toLowerCase() + ":" : ""}`)
                    .setAuthor({ name: profile.personaname, iconURL: avatarUrl }) // Make sure to pass an object
                    .setDescription(`**Вот его профиль:** ${profile.profileurl}`)
                    .setColor('Blue')
                    if (profile.personastate == 0 && profile.lastlogoff) {
                        embedMessage.addFields(
                            { name: `Был в сети:`, 
                              value: new Date(profile.lastlogoff * 1000).toLocaleString(), inline: true }
                        )
                    }
                    if (profile.timecreated) {
                        embedMessage.addFields({ name: "Дата создания аккаунта:", value: new Date(profile.timecreated * 1000).toLocaleString(), inline: true })
                    }
                    if (profile.gameextrainfo) {
                        embedMessage.addFields({ name: "В данный момент играет:", value: `[${profile.gameextrainfo}](https://store.steampowered.com/app/${profile.gameid})`, inline: false })
                    }
                    if (profile.realname) {
                        embedMessage.addFields({ name: 'Настоящее имя:', value: profile.realname, inline: false })
                    }

                return interaction.reply({ embeds: [embedMessage] });
            })
            .catch(error => {
                console.error("Error fetching player summary:", error);
                return interaction.reply({ content: 'Произошла ошибка при получении данных пользователя.', ephemeral: true });
            })
        }
    }
}