const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ytupload')
        .setDescription('Воспроизведение треков из YouTube, SoundCloud и Spotify в голосовом канале!')
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Ссылка на YouTube, SoundCloud или Spotify')
                .setRequired(true)),
    
    run: async (client, interaction) => {
        const link = interaction.options.getString('link');

        if (!interaction.member.voice.channel) {
            return interaction.reply('Вы должны быть в голосовом канале, чтобы использовать эту команду.');
        }

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        })

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });

        await interaction.reply(`Теперь воспроизведу: ${link}`);

        try {
            // Определение источника ссылки
            const url = new URL(link);
            let audioStream;

            if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                // Обработка ссылок YouTube
                audioStream = await play.stream(link)
                if (!audioStream) {
                    throw new Error('Не удалось найти аудиопоток на YouTube');
                }
            } else if (url.hostname.includes('soundcloud.com')) {
                // Авторизация для SoundCloud
                const clientID = await play.getFreeClientID();
                play.setToken({
                    soundcloud: {
                        client_id: clientID
                    }
                });
                audioStream = await play.stream(link);
                if (!audioStream) {
                    throw new Error('Не удалось найти аудиопоток на SoundCloud');
                }
            } else if (url.hostname.includes('spotify.com')) {
                // Обработка ссылок Spotify
                if (play.is_expired()) {
                    await play.refreshToken();
                }
                let sp_data = await play.spotify(url.href);

                let searched = await play.search(`${sp_data.name}`, {
                    limit: 1
                });
                audioStream = await play.stream(searched[0].url);
                if (!audioStream) {
                    throw new Error('Не удалось найти аудиопоток на Spotify');
                }
            } else {
                throw new Error('Неподдерживаемый источник');
            }
            console.log(audioStream)
            const resource = createAudioResource(audioStream.stream, {
                inputType: audioStream.type
            });

            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => {
                try {
                    connection.destroy();
                } catch (err) {
                    console.log(err);
                }
            });

            player.on('error', err => {
                console.error(`Ошибка плеера: ${err.message}`);
                interaction.followUp('Произошла ошибка при воспроизведении аудио.');
                try {
                    connection.destroy();
                } catch (err) {
                    console.log(err);
                }
            });

        } catch (error) {
            console.error(`Ошибка потока: ${error}`);
            interaction.followUp('Произошла ошибка при подключении к видео или треку.');
            try {
                connection.destroy();
            } catch (err) {
                console.log(err);
            }
        }
    }
};