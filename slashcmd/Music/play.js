const { SlashCommandBuilder } = require('@discordjs/builders')
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, VoiceConnectionStatus } = require('@discordjs/voice')
const { EmbedBuilder } = require("discord.js")
const Queue = require('../../models/queue.model')
const play = require('play-dl')
const ytdl = require('ytdl-core')
const ffmpeg = require('fluent-ffmpeg')
require('dotenv').config()
const formatTime = require('../../modules/formatTime.js')

let connections = new Map() // Хранение соединений и плееров по ключу guildId-voiceChannelId

function connectToVoiceChannel(voiceChannelId, guildId, adapterCreator, interaction) {
    const connection = joinVoiceChannel({
        channelId: voiceChannelId,
        guildId: guildId,
        adapterCreator: adapterCreator,
    })

    connection.on('stateChange', (oldState, newState) => {
        if (newState.status === VoiceConnectionStatus.Disconnected) {
            connections.delete(`${guildId}-${voiceChannelId}`)
            connection.destroy()
            interaction.followUp('Соединение уничтожено. Бот был выгнан или отключён.')
        }
    })

    return connection
}

async function playNextTrack(guildId, voiceChannelId) {
    const key = `${guildId}-${voiceChannelId}`
    const connectionData = connections.get(key)

    if (!connectionData) {
        console.error(`Соединение для ключа ${key} не найдено.`)
        return
    }

    const { player, connection } = connectionData
    const queue = await Queue.findOne({ guildId, voiceChannelId })
    if (!queue || queue.queue.length === 0) {
        try {
            queue.nowPlaying = null
            await queue.save()

            if (connection.state.status !== 'destroyed') {
                connection.destroy()
            }

            connections.delete(key)
            return
        } catch (err) {
            console.log(err)
        }
    }

    const nextTrack = queue.queue.shift()
    if (!nextTrack) {
        console.error('Следующий трек не найден.')
        return
    }
    queue.nowPlaying = nextTrack
    await queue.save()

    try {
        const url = new URL(nextTrack.url)

        // Проверяем, поддерживает ли URL прямое воспроизведение (mp3, ogg и т.д.)
        if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.ogg')) {
            const resource = createAudioResource(nextTrack.url, {
                inlineVolume: true // Включите эту опцию, если хотите регулировать громкость
            })
            player.play(resource)
            connection.subscribe(player)
        } else {
            // Поддержка других источников с использованием `play-dl`
            const audioStream = await play.stream(nextTrack.url)
            if (!audioStream || !audioStream.stream || !audioStream.stream.readable) {
                throw new Error('Аудиопоток недоступен или пуст')
            }

            const resource = createAudioResource(audioStream.stream, {
                inputType: audioStream.type,
            })

            player.play(resource)
            connection.subscribe(player)
        }
    } catch (error) {
        console.error(`Ошибка при воспроизведении трека: ${error.message}`)
        playNextTrack(guildId, voiceChannelId) // Попробовать воспроизвести следующий трек
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Воспроизведение треков из SoundCloud и Deezer в голосовом канале!')
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Введите ссылку на SoundCloud или Deezer')
                .setRequired(true)),
    
    run: async (client, interaction) => {
        const link = interaction.options.getString('link')
        const guildId = interaction.guildId
        const voiceChannelId = interaction.member.voice.channelId

        if (!voiceChannelId) {
            return interaction.reply('Вы должны быть в голосовом канале, чтобы использовать эту команду.')
        }

        // Проверка, играет ли бот уже на другом канале в этом же сервере
        const activeConnection = Array.from(connections.keys()).find(key => key.startsWith(`${guildId}-`))

        if (activeConnection && activeConnection !== `${guildId}-${voiceChannelId}`) {
            const [activeGuildId, activeVoiceChannelId] = activeConnection.split('-')
            const activeChannel = interaction.guild.channels.cache.get(activeVoiceChannelId)
            return interaction.reply({content: `Не стесняйтесь! Вы можете послушать мелодию с другими участниками этого сервера на канале **${activeChannel.name}**.`, ephemeral: true})
        }

        let queue = await Queue.findOne({ guildId, voiceChannelId })
        if (!queue) {
            queue = await Queue.create({
                guildId,
                voiceChannelId,
                queue: []
            })
        }

        const key = `${guildId}-${voiceChannelId}`
        let connectionInfo = connections.get(key)

        if (!connectionInfo) {
            // Используем новую функцию для создания соединения
            const connection = connectToVoiceChannel(voiceChannelId, guildId, interaction.guild.voiceAdapterCreator, interaction)

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play
                }
            })

            player.on(AudioPlayerStatus.Idle, () => {
                playNextTrack(guildId, voiceChannelId) // Воспроизвести следующий трек в очереди
            })

            player.on('error', err => {
                console.error(`Ошибка плеера: ${err.message}`)
                try {
                    connection.destroy()
                } catch (err) {
                    console.log(err)
                }
                connections.delete(key)
            })

            connectionInfo = { player, connection }
            connections.set(key, connectionInfo)
        }

        try {
            await interaction.deferReply()

            let url
            try {
                url = new URL(link)
            } catch {
                if (connectionInfo && connectionInfo.connection && connectionInfo.player.state.status !== AudioPlayerStatus.Playing) {
                    try {
                        connectionInfo.connection.destroy()
                        connections.delete(key)
                    } catch (err) {
                        console.log(err)
                    }
                }
                return interaction.editReply({ content: 'Невалидная ссылка', ephemeral: true })
            }
            let embedMessage

            if (url.hostname.includes('soundcloud.com')) {
                const clientID = await play.getFreeClientID()
                play.setToken({ soundcloud: { client_id: clientID } })

                let so_info = await play.soundcloud(link)
                if (so_info.type === 'playlist') {
                    embedMessage = new EmbedBuilder()
                        .setTitle(`${so_info.name}`)
                        .setAuthor({ name: "SoundCloud", iconURL: "https://bit.ly/46Vfe0f" })
                        .setDescription(`<@${interaction.user.id}> воспроизводит аудио **${so_info.tracks[0].name}**`)
                        .addFields({ name: `Длительность: ${formatTime(so_info.tracks[0].durationInMs)}`, value: `[Вот и данный шедевр](${so_info.tracks[0].permalink})` })
                        .setThumbnail(so_info.tracks[0].thumbnail)
                        .setColor('Orange')
                    queue.queue.push({ url: so_info.tracks[0].permalink, title: so_info.tracks[0].title })
                } else {
                    const apiUrl = `https://api-v2.soundcloud.com/resolve?url=${link}&client_id=${clientID}`
                    const response = await fetch(apiUrl)
                    const trackInfo = await response.json()

                    embedMessage = new EmbedBuilder()
                        .setTitle(`${trackInfo.user.username ? trackInfo.user.username : "Неизвестно"}`)
                        .setAuthor({ name: "SoundCloud", iconURL: "https://bit.ly/46Vfe0f" })
                        .setDescription(`<@${interaction.user.id}> воспроизводит аудио **${trackInfo.title}**`)
                        .addFields({ name: `Длительность: ${formatTime(trackInfo.full_duration)}`, value: `[Вот и данный шедевр](${link})` })
                        .setThumbnail(trackInfo.artwork_url)
                        .setColor('Orange')
                    queue.queue.push({ url: trackInfo.permalink_url, title: trackInfo.title })
                }

            } else if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.ogg')) {
                try {
                    // Проверяем доступность файла по ссылке
                    const response = await fetch(url)
                    if (!response.ok) {
                        if (connectionInfo.player.state.status !== AudioPlayerStatus.Playing) {    
                            connectionInfo.connection.destroy()
                            connections.delete(key) // Начать воспроизведение первого трека в очереди
                        }
                        return interaction.editReply({ content: 'Файл недоступен.', ephemeral: true })
                    }
            
                    // Определяем, какой тип файла и создаем соответствующий Embed
                    const fileType = url.pathname.endsWith('.mp3') ? '.mp3' : '.ogg'
                    const iconURL = fileType === '.mp3' 
                        ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRXsK7yffrKNx1cVvewr94ol8y1_L5l7CT_Q&s" 
                        : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA0qPqubxO-ly4-73wLdvJ0f8P7s3_0AZgZg&s"
                    
                    embedMessage = new EmbedBuilder()
                        .setTitle(`Неизвестно`)
                        .setAuthor({ name: `${fileType} Файл`, iconURL })
                        .setDescription(`<@${interaction.user.id}> воспроизводит аудио с неизвестного источника`)
                        .addFields({ name: `Не рекомендую заходить на неизвестный источник, но если НАДО, то...`, value: `[Вот и данный шедевр](${link})` })
                        .setThumbnail(fileType === '.mp3' 
                            ? "https://static7.depositphotos.com/1037613/787/i/450/depositphotos_7870398-stock-photo-mp3-music.jpg" 
                            : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA0qPqubxO-ly4-73wLdvJ0f8P7s3_0AZgZg&s")
                        .setColor('Random')
            
                    queue.queue.push({ url, title: "Неизвестно" })
                } catch (error) {
                    console.error(`Ошибка при проверке доступности файла: ${error}`)
                    return interaction.editReply({ content: 'Файл недоступен.', ephemeral: true })
                }
            } else if (url.hostname.includes('www.deezer.com')) {
                const clientID = await play.getFreeClientID()
                play.setToken({ soundcloud: { client_id: clientID } })
                let dz_data = await play.deezer(link)
                console.log(dz_data)
                let searched = await play.search(`${dz_data.shortTitle}`, { limit: 1, source: { soundcloud: "tracks" } })
                console.log(searched)
                embedMessage = new EmbedBuilder()
                    .setTitle(`${dz_data.artist.name}`)
                    .setAuthor({ name: "Deezer", iconURL: "https://styles.redditmedia.com/t5_2w20j/styles/communityIcon_mr3txo0yyyyb1.png" })
                    .setDescription(`<@${interaction.user.id}> добавил трек с Deezer: **${dz_data.shortTitle}** в очередь`)
                    .addFields({ name: `Длительность: ${formatTime(searched[0].durationInMs)}`, value: `[Слушать трек](${dz_data.url})` })
                    .setColor('Purple')

                queue.queue.push({ url: searched[0].permalink, title: dz_data.shortTitle })

            } else {
                return interaction.editReply({ content: 'Неподдерживаемый источник', ephemeral: true })
            }
            await queue.save()
            await interaction.editReply({ embeds: [embedMessage] })

            if (connectionInfo.player.state.status !== AudioPlayerStatus.Playing && connectionInfo.player.state.status !== AudioPlayerStatus.Paused) {    
                playNextTrack(guildId, voiceChannelId) // Начать воспроизведение первого трека в очереди
            }

            await interaction.editReply({ content: 'Трек добавлен в очередь!' })
        } catch (error) {
            console.error(`Ошибка: ${error}`)
            await interaction.followUp('Произошла ошибка при подключении к треку.')
            
            // Проверяем, существует ли connectionInfo и connection, перед тем как попытаться уничтожить
            if (connectionInfo && connectionInfo.connection) {
                try {
                    connectionInfo.connection.destroy()
                    connections.delete(key)
                } catch (err) {
                    console.log(err)
                }
            }
        }
    },
    connections
}