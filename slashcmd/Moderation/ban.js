const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Банит пользователя временно или навсегда')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .setDMPermission(false)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('Пользователь, которого нужно забанить')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Продолжительность бана (например: 1h, 2d, 3w)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Причина бана')
                .setRequired(false)
        ),

    run: async (client, interaction) => {
        // Проверка прав пользователя
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'У вас нет прав на бан пользователей.', ephemeral: true });
        }

        // Получаем указанного пользователя, длительность и причину
        const target = interaction.options.getUser('target');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'Не указана';

        // Попытка получить члена гильдии
        const member = interaction.guild.members.cache.get(target.id);
        if (!member) {
            return interaction.reply({ content: 'Этот пользователь не является участником сервера.', ephemeral: true });
        }

        // Баним пользователя
        try {
            await member.ban({ reason });

            // Если бан успешен, отправляем личное сообщение с причиной бана
            try {
                const embedMessageToUser = new EmbedBuilder()
                    .setTitle('Бан выполнен')
                    .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                    .setDescription(`Вы были забанены на сервере **${interaction.guild.name}**`)
                    .addFields({ name: "На сколько", value: `на ${duration}`, inline: true}, { name: "Причина", value: reason, inline: true})
                    .setColor('Random');
                await target.send({ embeds: [embedMessageToUser] });
            } catch (error) {
                console.error(`Не удалось отправить сообщение ${target.tag}: ${error}`);
            }

            // Если указана продолжительность, планируем разбан
            if (duration) {
                const milliseconds = parseDuration(duration);
                if (milliseconds) {
                    setTimeout(async () => {
                        try {
                            await interaction.guild.members.unban(target.id);
                        } catch (error) {
                            console.error(`Не удалось разбанить ${target.tag}: ${error}`);
                        }
                    }, milliseconds);
                } else {
                    return interaction.reply({ content: 'Указан неверный формат времени.', ephemeral: true });
                }
            }

            // Сообщение об успешном бане в канал
            const embedMessageToChannel = new EmbedBuilder()
                .setTitle('Бан выполнен')
                .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                .setDescription(`Пользователь <@${target.id}> был забанен`)
                .addFields({ name: "На сколько", value: duration, inline: true}, { name: "Причина", value: reason, inline: true})
                .setColor('Random');
            return interaction.reply({ embeds: [embedMessageToChannel], ephemeral: false });

        } catch (error) {
            console.error(`Не удалось забанить ${target.tag}: ${error}`);
            return interaction.reply({ content: `Не удалось забанить <@${target.id}>.`, ephemeral: true });
        }
    }
};

// Функция для преобразования строки с длительностью в миллисекунды
function parseDuration(duration) {
    const timeUnits = {
        s: 1000,         // секунды
        m: 1000 * 60,    // минуты
        h: 1000 * 60 * 60, // часы
        d: 1000 * 60 * 60 * 24, // дни
        w: 1000 * 60 * 60 * 24 * 7, // недели
    };

    const match = duration.match(/^(\d+)([smhdw])$/);
    if (match) {
        const value = parseInt(match[1]);
        const unit = timeUnits[match[2]];
        return value * unit;
    } else {
        return "НАВСЕГДА!!!";
    }
}