const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Выгоняет пользователя с сервера')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .setDMPermission(false)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('Пользователь, которого нужно выгнать')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Причина, по которой пользователь выгоняется')
                .setRequired(false)
        ),

    run: async (client, interaction) => {
        // Проверка прав пользователя
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: 'У вас нет прав на кик пользователей.', ephemeral: true });
        }

        // Получаем указанного пользователя и причину
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'Не указана';

        // Попытка получить члена гильдии
        const member = interaction.guild.members.cache.get(target.id);
        if (!member) {
            return interaction.reply({ content: 'Этот пользователь не является участником сервера.', ephemeral: true });
        }

        // Кикаем пользователя
        try {
            await member.kick(reason);

            // Отправляем личное сообщение с причиной кика, только если кик успешен
            try {
                const embedMessageToUser = new EmbedBuilder()
                    .setTitle('Внимание!')
                    .setDescription(`Вы были выгнаны с сервера ${interaction.guild.name}. Причина: **${reason}**`)
                    .setColor('Random');
                await target.send({ embeds: [embedMessageToUser] });
            } catch (error) {
                console.error(`Не удалось отправить сообщение ${target.tag}: ${error}`);
            }

            // Отправляем сообщение в канал о том, что пользователь был выгнан
            const embedMessageToChannel = new EmbedBuilder()
                .setTitle('Внимание!')
                .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ size: 256, dynamic: true })}` })
                .setDescription(`Пользователь <@${target.id}> был выгнан с сервера. Причина: **${reason}**`)
                .setColor('Random');
            return interaction.reply({ embeds: [embedMessageToChannel], ephemeral: false });
        } catch (error) {
            console.error(`Не удалось выгнать <@${target.id}>: ${error}`);
            return interaction.reply({ content: `Не удалось выгнать <@${target.id}>.`, ephemeral: true });
        }
    }
}