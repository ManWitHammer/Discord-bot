const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, getVoiceConnection } = require('@discordjs/voice');
const { EmbedBuilder } = require("discord.js");
const Queue = require('../../models/queue.model');
const play = require('play-dl');
const { connections } = require('./play.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Ищет по текстку трек из SoundCloud')
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName('prompt')
                .setDescription('Введите название трека')
                .setRequired(true)),

    run: async (client, interaction) => {
        const guildId = interaction.guildId;
        const prompt = interaction.options.getString('prompt');
        const voiceChannelId = interaction.member.voice.channelId;
        if (!voiceChannelId) {
            return interaction.reply({ content: 'Вы должны быть в голосовом канале, чтобы использовать эту команду.', ephemeral: true });
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
        await interaction.deferReply();

        let queue = await Queue.findOne({ guildId, voiceChannelId });

        if (!queue) {
            queue = await Queue.create({
                guildId,
                voiceChannelId,
                queue: []
            });
        }

        const clientID = await play.getFreeClientID();
        play.setToken({ soundcloud: { client_id: clientID } });

        let searched = await play.search(`${prompt}`, { limit: 1, source: { soundcloud: "tracks" } });
        if (!searched[0]) {
            return interaction.editReply({ content: 'Не удалось найти трек. Попробуйте еще раз.', ephemeral: true });
        }
        embedMessage = new EmbedBuilder()
            .setTitle(`${searched[0].user.name}`)
            .setAuthor({ name: "SoundCloud", iconURL: "https://bit.ly/46Vfe0f" })
            .setDescription(`<@${interaction.user.id}> воспроизводит аудио **${searched[0].name}**`)
            .addFields({ name: `Длительность: ${formatTime(searched[0].durationInMs)}`, value: `[Вот и данный шедевр](${searched[0].permalink})` })
            .setThumbnail(searched[0].thumbnail)
            .setColor('Orange');

        queue.queue.push({ url: searched[0].permalink, title: searched[0].name });
        await queue.save();
        
        await interaction.editReply({ embeds: [embedMessage] });
        if (connectionInfo.player.state.status !== AudioPlayerStatus.Playing && connectionInfo.player.state.status !== AudioPlayerStatus.Paused) {
            playNextTrack(guildId, voiceChannelId); // Начать воспроизведение первого трека в очереди
        }
    }
}

async function playNextTrack(guildId, voiceChannelId) {
    const key = `${guildId}-${voiceChannelId}`;
    const connectionData = connections.get(key);

    if (!connectionData) {
        console.error(`Соединение для ключа ${key} не найдено.`);
        return;
    }

    const { player, connection } = connectionData;
    const queue = await Queue.findOne({ guildId, voiceChannelId });

    if (!queue || queue.queue.length === 0) {
        try {
            queue.nowPlaying = null;
            await queue.save();

            if (connection.state.status !== 'destroyed') {
                connection.destroy();
            }
            connections.delete(key);
            return;
        } catch (err) {
            console.log(err);
        }
    }

    const nextTrack = queue.queue.shift();
    if (!nextTrack) {
        console.error('Следующий трек не найден.');
        return;
    }
    
    queue.nowPlaying = nextTrack;
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