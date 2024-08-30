const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

// Пример категорий команд
const commandCategories = {
    'Для администраторов': [
        { name: 'sub', description: 'Подписаться на уведомления определенного Twitch стримера' },
        { name: 'unsub', description: 'Отписываться от уведомлений определенного Twitch стримера' },
        { name: 'setbadwords', description: 'Устанавить плохие слова для этого сервера (разделенные запятыми)' },
        { name: 'delbadwords', description: 'Удалить определённое слово из списка плохих слов' },
    ],
    'Модерация(ДЛЯ МОДЕРАТОРОВ И АДМИНОВ)': [
        { name: 'ban', description: 'Забанить пользователя на определённое время или навсегда' },
        { name: 'kick', description: 'Выгнать пользователя' },
        { name: 'kickvc', description: 'Выгоняет всех из определённого голосового канала' },
        { name: 'clean', description: 'Удаляет сообщения в чате' },
        { name: 'mute', description: 'Замутить пользователя' },
        { name: 'unmute', description: 'Размутить пользователя' },
        { name: 'warn', description: 'Выдать предупреждение пользователю' },
        { name: 'delwarn', description: 'Удалить предупреждение пользователя' },
    ],
    'Музыка': [
        { name: 'play', description: 'Воспроизвести трек' },
        { name: 'search', description: 'Ищет трек и воспроизводит его' },
        { name: 'skip', description: 'Пропустить трек' },
        { name: 'pause', description: 'Поставить трек на паузу' },
        { name: 'resume', description: 'Возобновить трек' },
        { name: 'repeat', description: 'Поставить текущий трек на повтор' },
        { name: 'retry', description: 'Повторить Текущий трек' },
        { name: 'shuffle', description: 'Перемешать очередь треков' },
        { name: 'queue', description: 'Показать очередь треков' },
        { name: 'nowplaying', description: 'Показать текущий трек' },

    ],
    'Другое': [
        { name: 'badwords', description: 'Показать список плохих слов' },
        { name: 'getwarns', description: 'Показать список предупреждений пользователя' },
        { name: 'getsubs', description: 'Показать список подписанных каналов на этом сервере' },
        { name: 'giphy', description: 'Показать рандомную гифку' },
        { name: 'useravatar', description: 'Показать аватар пользователя' },
        { name: 'translate', description: 'Перевести текст на другой язык' },
        { name: 'help', description: 'Показать список команд по категориям' }
    ]
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Показать список команд по категориям'),

    async run(client, interaction) {
        // Создание меню выбора категорий
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select-category')
            .setPlaceholder('Выберите категорию команд')
            .addOptions(Object.keys(commandCategories).map(category => ({
                label: category.charAt(0).toUpperCase() + category.slice(1), // Преобразование первой буквы в заглавную
                value: category
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: 'Выберите категорию команд:',
            components: [row],
            ephemeral: true // Сообщение будет видно только пользователю, вызвавшему команду
        });

        // Обработчик события выбора меню
        const filter = i => i.customId === 'select-category' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            try {
                const category = i.values[0];
                const commands = commandCategories[category];

                const embed = new EmbedBuilder()
                    .setTitle(`Команды категории: ${category.charAt(0).toUpperCase() + category.slice(1)}`)
                    .setColor('Random')
                    .setDescription(commands.map(cmd => `**/${cmd.name}** - ${cmd.description}`).join('\n'));

                await i.update({ embeds: [embed], components: [] }); // Обновляем сообщение и убираем меню
            } catch (error) {
                if (error.code === 10062) {
                    await interaction.followUp({ content: 'Взаимодействие истекло. Попробуйте снова.', ephemeral: true });
                }
            }
        });
        collector.on('end', async collected => {
            if (collected.size === 0) {
                await interaction.editReply({ content: 'Время выбора истекло.', components: [] });
            }
        });
    }
};