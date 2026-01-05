const { SlashCommandBuilder } = require('@discordjs/builders')
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, VoiceConnectionStatus, StreamType } = require('@discordjs/voice')
const { EmbedBuilder } = require("discord.js")
const Queue = require('../../models/queue.model')
const play = require('play-dl')
require('dotenv').config()
const formatTime = require('../../modules/formatTime.js')
const { spawn } = require('child_process');
const path = require('path');


let connections = new Map()

function connectToVoiceChannel(voiceChannelId, guildId, adapterCreator, interaction) {
    const connection = joinVoiceChannel({
        channelId: voiceChannelId,
        guildId: guildId,
        adapterCreator: adapterCreator,
    })

    connection.on('stateChange', (_, newState) => {
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

        if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.ogg')) {
            const resource = createAudioResource(nextTrack.url, {
                inlineVolume: true 
            })
            player.play(resource)
            connection.subscribe(player)
        } else if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
            const ytDlp = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...', nextTrack.url]);
            const ffmpeg = spawn('ffmpeg', [
                '-i', 'pipe:0',
                '-f', 's16le',
                '-ar', '48000',
                '-ac', '2',
                'pipe:1',
            ]);

            ytDlp.stdout.pipe(ffmpeg.stdin);
            const resource = createAudioResource(ffmpeg.stdout, { inputType: StreamType.Raw });
            player.play(resource);
            connection.subscribe(player);
        } else {
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
        playNextTrack(guildId, voiceChannelId)
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Воспроизведение треков из SoundCloud, Youtube и Deezer в голосовом канале!')
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Введите ссылку на SoundCloud, Youtube или Deezer')
                .setRequired(true)),
    
    run: async (_, interaction) => {
        const link = interaction.options.getString('link')
        const guildId = interaction.guildId
        const voiceChannelId = interaction.member.voice.channelId

        if (!voiceChannelId) {
            return interaction.reply('Вы должны быть в голосовом канале, чтобы использовать эту команду.')
        }

        const activeConnection = Array.from(connections.keys()).find(key => key.startsWith(`${guildId}-`))

        if (activeConnection && activeConnection !== `${guildId}-${voiceChannelId}`) {
            const [_, activeVoiceChannelId] = activeConnection.split('-')
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
            const connection = connectToVoiceChannel(voiceChannelId, guildId, interaction.guild.voiceAdapterCreator, interaction)

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play
                }
            })

            player.on(AudioPlayerStatus.Idle, () => {
                playNextTrack(guildId, voiceChannelId) 
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

            }  else if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                const videoInfo = await play.video_info(link);
                console.log(videoInfo.video_details.thumbnails);
                embedMessage = new EmbedBuilder()
                    .setTitle(`${videoInfo.video_details.channel.name}`)
                    .setAuthor({ name: "Youtube", iconURL: "https://cdn3.iconfinder.com/data/icons/2018-social-media-logotypes/1000/2018_social_media_popular_app_logo_youtube-512.png" })
                    .setDescription(`<@${interaction.user.id}> добавил трек с Youtube: **${videoInfo.video_details.title}** в очередь`)
                    .setThumbnail(videoInfo.video_details.thumbnails[2].url)
                    .addFields({ name: `Длительность: ${formatTime(videoInfo.video_details.durationInSec * 1000)}`, value: `[Смотреть видео](${link})` })
                    .setColor('Red');
                queue.queue.push({ url: videoInfo.video_details.url, title: videoInfo.video_details.title });
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
                playNextTrack(guildId, voiceChannelId)
            }

            await interaction.editReply({ content: 'Трек добавлен в очередь!' })
        } catch (error) {
            console.error(`Ошибка: ${error}`)
            await interaction.followUp('Произошла ошибка при подключении к треку.')
            
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
