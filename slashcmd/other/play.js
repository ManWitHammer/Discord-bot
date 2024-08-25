const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const { EmbedBuilder } = require("discord.js");
const Queue = require('../../models/queue.model');
const play = require('play-dl');
require('dotenv').config();

let connections = new Map(); // Хранение соединений и плееров по ключу guildId-voiceChannelId

async function playNextTrack(guildId, voiceChannelId) {
    const key = `${guildId}-${voiceChannelId}`;
    const { player, connection } = connections.get(key);
    const queue = await Queue.findOne({ guildId, voiceChannelId });

    if (!queue || queue.queue.length === 0) {
        connection.destroy();
        connections.delete(key);
        return;
    }

    const nextTrack = queue.queue.shift();
    await queue.save();

    try {
        const audioStream = await play.stream(nextTrack.url);
        if (!audioStream || !audioStream.stream || !audioStream.stream.readable) {
            throw new Error('Аудиопоток недоступен или пуст');
        }

        const resource = createAudioResource(audioStream.stream, {
            inputType: audioStream.type,
        });

        player.play(resource);
        connection.subscribe(player);
    } catch (error) {
        console.error(`Ошибка при воспроизведении трека: ${error.message}`);
        playNextTrack(guildId, voiceChannelId); // Попробовать воспроизвести следующий трек
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Воспроизведение треков из SoundCloud, Spotify и Deezer в голосовом канале!')
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Введите ссылку на SoundCloud, Spotify или Deezer')
                .setRequired(true)),
    
    run: async (client, interaction) => {
        const link = interaction.options.getString('link');
        const guildId = interaction.guildId;
        const voiceChannelId = interaction.member.voice.channelId;

        if (!voiceChannelId) {
            return interaction.reply('Вы должны быть в голосовом канале, чтобы использовать эту команду.');
        }

        // Проверка, играет ли бот уже на другом канале в этом же сервере
        const activeConnection = Array.from(connections.keys()).find(key => key.startsWith(`${guildId}-`));

        if (activeConnection && activeConnection !== `${guildId}-${voiceChannelId}`) {
            const [activeGuildId, activeVoiceChannelId] = activeConnection.split('-');
            const activeChannel = interaction.guild.channels.cache.get(activeVoiceChannelId);
            return interaction.reply({content: `Не стесняйтесь! Вы можете послушать мелодию с другими участниками этого сервера на канале **${activeChannel.name}**.`, ephemeral: true});
        }

        let queue = await Queue.findOne({ guildId, voiceChannelId });
        if (!queue) {
            queue = await Queue.create({
                guildId,
                voiceChannelId,
                queue: []
            });
        }

        const key = `${guildId}-${voiceChannelId}`;
        let connectionInfo = connections.get(key);

        if (!connectionInfo) {
            const connection = joinVoiceChannel({
                channelId: voiceChannelId,
                guildId: guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play
                }
            });

            player.on(AudioPlayerStatus.Idle, () => {
                playNextTrack(guildId, voiceChannelId); // Воспроизвести следующий трек в очереди
            });

            player.on('error', err => {
                console.error(`Ошибка плеера: ${err.message}`);
                try {
                    connection.destroy();
                } catch (err) {
                    console.log(err);
                }
                connections.delete(key);
            });

            connectionInfo = { player, connection };
            connections.set(key, connectionInfo);
        }

        try {
            await interaction.deferReply();

            const url = new URL(link);
            let embedMessage;

            if (url.hostname.includes('soundcloud.com')) {
                const clientID = await play.getFreeClientID();
                play.setToken({ soundcloud: { client_id: clientID } });

                let so_info = await play.soundcloud(link);
                if (so_info.type === 'playlist') {
                    embedMessage = new EmbedBuilder()
                        .setTitle(`${so_info.name}`)
                        .setAuthor({ name: "SoundCloud", iconURL: "https://bit.ly/46Vfe0f" })
                        .setDescription(`<@${interaction.user.id}> добавил альбом **${so_info.name}** в очередь`)
                        .addFields({ name: `Длительность всех треков: ${formatTime(so_info.durationInMs)}`, value: `[Послушать альбом](${link})` })
                        .setColor('Orange');
                    queue.queue.push({ url: so_info.tracks[0].permalink, title: so_info.tracks[0].title })
                } else {
                    const apiUrl = `https://api-v2.soundcloud.com/resolve?url=${link}&client_id=${clientID}`;
                    const response = await fetch(apiUrl);
                    const trackInfo = await response.json();

                    embedMessage = new EmbedBuilder()
                        .setTitle(`${trackInfo.user.username}`)
                        .setAuthor({ name: "SoundCloud", iconURL: "https://bit.ly/46Vfe0f" })
                        .setDescription(`<@${interaction.user.id}> воспроизводит аудио **${trackInfo.title}**`)
                        .addFields({ name: `Длительность: ${formatTime(trackInfo.full_duration)}`, value: `[Вот и данный шедевр](${link})` })
                        .setColor('Orange');
                    console.log(trackInfo);
                    queue.queue.push({ url: trackInfo.permalink_url, title: trackInfo.title });
                }

            } else if (url.hostname.includes('spotify.com')) {
                const sp_data = await play.spotify(link);
                let searched = await play.search(`${sp_data.name}`, { limit: 1, source: { soundcloud: "tracks" } });

                embedMessage = new EmbedBuilder()
                    .setTitle(`${sp_data.artists.map(artist => artist.name).join(", ")}`)
                    .setAuthor({ name: "Spotify", iconURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfqf6F3od2aaCpB_2wSudARaUV-RSl-jEhNg&s" })
                    .setDescription(`<@${interaction.user.id}> добавил трек **${sp_data.name}** в очередь`)
                    .addFields({ name: `Длительность: ${formatTime(sp_data.durationInMs)}`, value: `[Слушать трек](${link})` })
                    .setColor('Green');

                queue.queue.push({ url: searched[0].permalink, title: sp_data.name });
                
            } else if (url.hostname.includes('www.deezer.com')) {
                let dz_data = await play.deezer(link);
                let searched = await play.search(`${dz_data.tracks[0].shortTitle}`, { limit: 1, source: { soundcloud: "tracks" } });

                embedMessage = new EmbedBuilder()
                    .setTitle(`${dz_data.artist.name}`)
                    .setAuthor({ name: "Deezer", iconURL: "https://styles.redditmedia.com/t5_2w20j/styles/communityIcon_mr3txo0yyyyb1.png" })
                    .setDescription(`<@${interaction.user.id}> добавил трек с Deezer: **${dz_data.tracks[0].shortTitle}** в очередь`)
                    .addFields({ name: `Длительность: ${formatTime(searched[0].durationInMs)}`, value: `[Слушать трек](${link})` })
                    .setColor('Purple');

                queue.queue.push({ url: searched[0].permalink, title: dz_data.tracks[0].shortTitle });

            } else {
                throw new Error('Неподдерживаемый источник');
            }

            await queue.save();
            await interaction.editReply({ embeds: [embedMessage] });

            if (connectionInfo.player.state.status !== AudioPlayerStatus.Playing) {
                playNextTrack(guildId, voiceChannelId); // Начать воспроизведение первого трека в очереди
            }

            await interaction.editReply({ content: 'Трек добавлен в очередь!' });
        } catch (error) {
            console.error(`Ошибка: ${error}`);
            await interaction.followUp('Произошла ошибка при подключении к треку.');
            
            // Проверяем, существует ли connectionInfo и connection, перед тем как попытаться уничтожить
            if (connectionInfo && connectionInfo.connection) {
                try {
                    connectionInfo.connection.destroy();
                    connections.delete(key);
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }
};

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const formattedSeconds = seconds % 60;
    const formattedMinutes = minutes % 60;
    const formattedHours = hours;

    let timeString = '';

    if (formattedHours > 0) {
        timeString += `${formattedHours} Hour${formattedHours > 1 ? "s" : ""} `;
    }

    if (formattedMinutes > 0) {
        timeString += `${formattedMinutes} Minute${formattedMinutes > 1 ? "s" : ""} `;
    }

    timeString += `${formattedSeconds} Second${formattedSeconds > 1 ? "s" : ""}`;

    return timeString.trim();
}