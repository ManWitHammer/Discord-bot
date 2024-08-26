const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kickvc')
        .setDescription('Кикает всех пользователей из указанного голосового канала или из канала, где находитесь вы')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MoveMembers)
        .setDMPermission(false)
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Голосовой канал, из которого нужно кикнуть всех пользователей')
                .setRequired(false)  // Канал теперь не обязателен
                .addChannelTypes(ChannelType.GuildVoice)  // Только голосовые каналы
        ),

    run: async (client, interaction) => {
        // Проверка прав пользователя
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return interaction.reply({ content: 'У вас нет прав на кик участников из голосовых каналов.', ephemeral: true });
        }

        // Получаем выбранный голосовой канал, если он был указан
        let channel = interaction.options.getChannel('channel');

        // Если канал не указан, берем канал, в котором находится пользователь
        if (!channel) {
            channel = interaction.member.voice.channel;

            // Если пользователь не находится в голосовом канале
            if (!channel) {
                return interaction.reply({ content: 'Вы не находитесь в голосовом канале и не указали канал для кика.', ephemeral: true });
            }
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