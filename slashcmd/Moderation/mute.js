const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Мутит пользователя на определенное время')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers)
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Пользователь, которого нужно замутить')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Продолжительность мута (например: 10m, 1h, 2d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Причина мута')
                .setRequired(false)
        ),

    run: async (client, interaction) => {
        // Проверка прав пользователя
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return interaction.reply({ content: 'У вас нет прав на мут пользователей.', ephemeral: true });
        }

        // Получаем указанных пользователя, длительность и причину
        const target = interaction.options.getMember('target');
        const duration = interaction.options.getString('duration') || "15min";
        const reason = interaction.options.getString('reason') || 'Не указана';

        if (!target) {
            return interaction.reply({ content: 'Этот пользователь не является участником сервера.', ephemeral: true });
        }

        // Проверка длительности
        const milliseconds = parseDuration(duration);
        if (!milliseconds) {
            return interaction.reply({ content: 'Указан неверный формат времени.', ephemeral: true });
        }

        // Мутим пользователя
        try {
            await target.timeout(milliseconds, reason);

            // Отправляем личное сообщение с причиной мута
            try {
                const embedMessageToUser = new EmbedBuilder()
                    .setTitle('Вы были замучены')
                    .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                    .setDescription(`Вы были замучены на сервере **${interaction.guild.name}**`)
                    .addFields({ name: "На сколько", value: `на ${duration}`, inline: true}, { name: "Причина", value: reason, inline: true})
                    .setColor('Random');
                await target.send({ embeds: [embedMessageToUser] });
            } catch (error) {
                console.error(`Не удалось отправить сообщение ${target.user.username}: ${error}`);
            }
            // Сообщение об успешном муте в канал
            const embedMessageToChannel = new EmbedBuilder()
                .setTitle('Пользователь замучен')
                .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                .setDescription(`Пользователь <@${target.user.id}> был замучен`)
                .addFields({ name: "На сколько", value: duration, inline: true}, { name: "Причина", value: reason, inline: true})
                .setColor('Random');
            return interaction.reply({ embeds: [embedMessageToChannel] });

        } catch (error) {
            console.error(`Не удалось замутить ${target.user.username}: ${error}`);
            return interaction.reply({ content: `Не удалось замутить <@${target.user.id}>.`, ephemeral: true });
        }
    }
};

// Функция для преобразования строки с длительностью в миллисекунды
function parseDuration(duration) {
    const timeUnits = {
        s: 1000,         
        m: 1000 * 60,    
        h: 1000 * 60 * 60, 
        d: 1000 * 60 * 60 * 24, 
        w: 1000 * 60 * 60 * 24 * 7
    };

    const match = duration.match(/^(\d+)([smhdw])$/);
    if (match) {
        const value = parseInt(match[1]);
        const unit = timeUnits[match[2]];
        return value * unit;
    } else {
        return null;
    }
}