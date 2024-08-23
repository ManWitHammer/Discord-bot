const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const { EmbedBuilder } = require("discord.js");
const axios = require('axios');
const play = require('play-dl');
let queue = []; // Очередь треков
let musicPlay = false

async function fetchTrackDetails(trackId) {
    const clientID = await play.getFreeClientID();
    play.setToken({
        soundcloud: {
            client_id: clientID
        }
    });
    try {
        const response = await axios.get(`https://api.soundcloud.com/tracks/${trackId}`, {
            params: {
                client_id: clientID
            }
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching details for track ID ${trackId}:`, error);
        return null;
    }
  }

  async function playNextTrack(player, connection, retries = 0) {
    if (queue.length === 0) {
        // Если в очереди нет треков, уничтожаем соединение
        try {
            if (connection.state.status !== 'destroyed') { // Проверяем, что соединение не уничтожено
                connection.destroy();
            }
            musicPlay = false;
            return;
        } catch (err) {
            console.log(err);
        }
    }

    const nextTrack = queue.shift();

    if (nextTrack !== undefined && nextTrack.url === undefined) {
        const details = await fetchTrackDetails(nextTrack.id, nextTrack.clientID);
        if (details) {
            nextTrack.url = details.permalink_url;
        }
    }

    let audioStream;
    try {
        audioStream = await play.stream(nextTrack?.url); // Проверяем наличие nextTrack
        if (!audioStream) {
            throw new Error('Не удалось найти аудиопоток');
        }

        const resource = createAudioResource(audioStream.stream, {
            inputType: audioStream.type
        });

        player.play(resource);
        connection.subscribe(player);
    } catch (error) {
        console.error(`Ошибка при воспроизведении следующего трека: ${error.message}`);
        // Ограничиваем количество повторных попыток воспроизведения
        if (retries < 3) {
            await playNextTrack(player, connection, retries + 1);
        } else {
            console.error('Превышено максимальное количество попыток воспроизведения. Переход к следующему треку.');
            await playNextTrack(player, connection);
        }
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

        function formatTime(milliseconds) {
            const seconds = Math.floor(milliseconds / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);

            const formattedSeconds = seconds % 60;
            const formattedMinutes = minutes % 60;
            const formattedHours = hours;

            let timeString = '';

            if (formattedHours > 0) {
                timeString += `${formattedHours} Hour${formattedHours >= 1 ? "s" : ""} `;
            }

            if (formattedMinutes > 0) {
                timeString += `${formattedMinutes} Minute${formattedMinutes >= 1 ? "s" : ""} `;
            }

            timeString += `${formattedSeconds} Second${formattedSeconds >= 1 ? "s" : ""}`;

            return timeString.trim();
        }

        if (!interaction.member.voice.channel) {
            return interaction.reply('Вы должны быть в голосовом канале, чтобы использовать эту команду.');
        }

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });

        player.on(AudioPlayerStatus.Idle, () => {
            playNextTrack(player, connection); // Воспроизвести следующий трек в очереди
        });

        player.on('error', err => {
            console.error(`Ошибка плеера: ${err.message}`);
            interaction.followUp('Произошла ошибка при воспроизведении аудио.');
            try {
                connection.destroy();
                musicPlay = false
            } catch (err) {
                console.log(err);
            }
        });

        try {
            await interaction.deferReply();
            // Определение источника ссылки
            const url = new URL(link);
            let embedMessage;

            // if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
            //     audioStream = await play.stream(link);
            //     if (!audioStream) {
            //         throw new Error('Не удалось найти аудиопоток на YouTube');
            //     }
            //     embedMessage = new EmbedBuilder()
            //         .setTitle('YouTube Audio Stream')
            //         .setAuthor({ name: "YouTube", iconURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSen1KWdA87ueKwGWVZ09Dz433Be7tg0g55Og&s" })
            //         .setDescription(`@${interaction.user.username} воспроизводит аудио с YouTube`)
            //         .addFields({ name: `Воиспроизведенно: ${new Date().toLocaleString("ru")}`, value: `[Вот и данный шедевр](${link})` })
            //         .setColor('Red');
            //     queue.push({ url: link });
            // } 
            if (url.hostname.includes('soundcloud.com')) {
                const clientID = await play.getFreeClientID();
                play.setToken({
                    soundcloud: {
                        client_id: clientID
                    }
                });

                let so_info = await play.soundcloud(link);

                if (so_info.type === 'playlist') {
                    console.log("Это альбом")
                    embedMessage = new EmbedBuilder()
                        .setTitle(`${so_info.name}`)
                        .setAuthor({ name: "SoundCloud", iconURL: "https://bit.ly/46Vfe0f" })
                        .setDescription(`${interaction.user.username} воспроизводит альбом состоящая из ${so_info.tracksCount} треков!`)
                        .addFields({ name: `Длительность всех треков: ${formatTime(so_info.durationInMs)}`, value: `[Послушать альбом](${link})` })
                        .setColor('Orange');

                    await interaction.editReply({ embeds: [embedMessage] });

                    for (const track of so_info.tracks.slice(0, 5)) {
                        queue.push({ url: track.permalink, id: track.id, clientID });
                    }
                } else {
                    console.log("Это трек")
                    const apiUrl = `https://api-v2.soundcloud.com/resolve?url=${link}&client_id=${clientID}`;
                    const response = await fetch(apiUrl);
                    const trackInfo = await response.json();

                    embedMessage = new EmbedBuilder()
                        .setTitle(`${trackInfo.user.username}`)
                        .setAuthor({ name: "SoundCloud", iconURL: "https://bit.ly/46Vfe0f" })
                        .setDescription(`${interaction.user.username} воспроизводит аудио **${trackInfo.title}**`)
                        .addFields({ name: `Длительность: ${formatTime(trackInfo.full_duration)}`, value: `[Вот и данный шедевр](${link})` })
                        .setColor('Orange');

                    await interaction.editReply({ embeds: [embedMessage] });
                    queue.push({ url: link });
                }
            } 
            else if (url.hostname.includes('spotify.com')) {
                const clientID = await play.getFreeClientID();
                play.setToken({
                    soundcloud: {
                        client_id: clientID
                    }
                });
                if (play.is_expired()) {
                    await play.refreshToken();
                }
                let sp_data = await play.spotify(url.href);
                let searched = await play.search(`${sp_data.name}`, {
                    limit: 1,
                    source: { soundcloud: "tracks" }
                });

                embedMessage = new EmbedBuilder()
                    .setTitle(`${sp_data.artists.map(artist => artist.name).join(", ")}`)
                    .setAuthor({ name: "Spotify", iconURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfqf6F3od2aaCpB_2wSudARaUV-RSl-jEhNg&s" })
                    .setDescription(`${interaction.user.username} воспроизводит аудио с Spotify: **${sp_data.name}**`)
                    .addFields({ name: `Длительность: ${formatTime(sp_data.durationInMs)}`, value: `[Вот и данный шедевр](${link})` })
                    .setColor('Green');

                queue.push({ url: searched[0].permalink, id: searched[0].id });
            } else if (url.hostname.includes('www.deezer.com')) {
                // Логика для обработки Deezer
                let dz_data = await play.deezer(url.href);
                const clientID = await play.getFreeClientID();
                play.setToken({
                    soundcloud: {
                        client_id: clientID
                    }
                });

                let searched = await play.search(`${dz_data.tracks[0].shortTitle}`, {
                    limit: 1,
                    source: { soundcloud: "tracks" }
                });
        
                embedMessage = new EmbedBuilder()
                    .setTitle(`${dz_data.artist.name}`)
                    .setAuthor({ name: "Deezer", iconURL: "https://styles.redditmedia.com/t5_2w20j/styles/communityIcon_mr3txo0yyyyb1.png" })
                    .setDescription(`${interaction.user.username} воспроизводит аудио с Deezer: **${dz_data.tracks[0].shortTitle}**`)
                    .addFields({ name: `Длительность: ${formatTime(searched[0].durationInMs)}`, value: `[Вот и данный шедевр](${link})` })
                    .setColor('Purple');
        
                queue.push({ url: searched[0].permalink, id: searched[0].id });
            } else {
                throw new Error('Неподдерживаемый источник');
            }

            await interaction.editReply({ embeds: [embedMessage] });

            if (queue.length > 0 && !musicPlay) {
                musicPlay = true
                playNextTrack(player, connection); // Начать воспроизведение первого трека в очереди
            }
        } catch (error) {
            console.error(`Ошибка потока: ${error}`);
            interaction.followUp('Произошла ошибка при подключении к видео или треку.');
            musicPlay = false
            try {
                connection.destroy();
            } catch (err) {
                console.log(err);
            }
        }
    },
    queue
};