const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { spawn } = require('child_process');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xen')
        .setDescription('Заходит в голосовой канал, воспроизводит MP3 и выходит'),

    run: async (client, interaction) => {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'Вы должны быть в голосовом канале для использования этой команды.', ephemeral: true });
        }

        // Путь к MP3 файлу
        const outputPath = './output.mp3';

        // Генерация MP3 файла, если его нет
        const generateMp3 = () => {
            return new Promise((resolve, reject) => {
                if (fs.existsSync(outputPath)) {
                    resolve(); // Файл уже существует
                    return;
                }

                const ffmpeg = spawn('ffmpeg', [
                    '-y', // перезаписывать файл, если он уже существует
                    '-f', 'lavfi',
                    '-i', 'sine=frequency=1000:duration=5', // простой сигнал для примера
                    '-c:a', 'libmp3lame',
                    outputPath
                ]);

                ffmpeg.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error('Ошибка при генерации MP3'));
                    }
                });
            });
        };

        try {
            await generateMp3();

            // Подключаемся к голосовому каналу
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            // Создание аудио ресурса
            const resource = createAudioResource(outputPath);
            const player = createAudioPlayer();

            // Подключаем player к соединению
            connection.subscribe(player);

            // Воспроизведение и завершение работы после окончания
            player.play(resource);
            player.on('idle', () => {
                player.stop();
                connection.destroy(); // Отключаемся от голосового канала
                interaction.followUp({ content: 'Воспроизведение завершено. Бот покинул голосовой канал.', ephemeral: true });
            });

            return interaction.reply({ content: 'Захожу в голосовой канал и воспроизвожу звук...', ephemeral: true });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Ошибка при создании MP3 файла или подключении к голосовому каналу.', ephemeral: true });
        }
    }
};