const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kickvc')
        .setDescription('Кикает всех пользователей из указанного голосового канала')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Голосовой канал, из которого нужно кикнуть всех пользователей')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)  // Только голосовые каналы
        ),

    run: async (client, interaction) => {
        // Массив с ID ролей, которые должны иметь доступ к команде
        const requiredRoleIds = ['1273229981115482166', '1273319648460279809'];  // Замените на реальные ID ролей

        // Проверяем, есть ли у пользователя хотя бы одна из необходимых ролей
        const hasRequiredRole = requiredRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

        if (!hasRequiredRole) {
            return interaction.reply({ content: 'У вас нет прав использовать эту команду. Необходима соответствующая роль.', ephemeral: true });
        }

        // Получаем выбранный голосовой канал
        const channel = interaction.options.getChannel('channel');

        // Проверка прав пользователя
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return interaction.reply({ content: 'У вас нет прав на кик участников из голосовых каналов.', ephemeral: true });
        }

        // Проверка, является ли канал голосовым
        if (channel.type !== ChannelType.GuildVoice) {
            return interaction.reply({ content: 'Пожалуйста, укажите действительный голосовой канал.', ephemeral: true });
        }

        // Получение списка участников в канале
        const members = channel.members;

        if (members.size === 0) {
            return interaction.reply({ content: 'В указанном канале нет пользователей.', ephemeral: true });
        }

        // Кик всех участников
        members.forEach(member => {
            member.voice.disconnect().catch(error => console.error(`Не удалось кикнуть ${member.user.tag}: ${error}`));
        });

        return interaction.reply({ content: `Все пользователи были кикнуты из канала ${channel.name}.`, ephemeral: true });
    }
};