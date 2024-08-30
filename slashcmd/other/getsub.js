const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Subscription = require('../../models/sub.model.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getsubs')
        .setDescription('Показывает список подписанных каналов на этом сервере')
        .setDMPermission(false),

    run: async (client, interaction) => {
        const guildId = interaction.guildId;
        const subscription = await Subscription.find({ guildId });

        if (subscription.length === 0) {
            // Отправляем ответ и завершаем выполнение
            return interaction.reply({ content: "Cписок подписанных каналов пустой", ephemeral: true });
        }
        else {
            const subEmbed = new EmbedBuilder()
                .setTitle('Список подписок на уведомления')
                .setColor('Random');

            subscription.forEach((sub, index) => {
                subEmbed.addFields(
                    { name: `${index + 1}. ${sub.twitchUsername}`, value: `[Вот ссылка канала](https://twitch.tv/${sub.twitchUsername})` }
                );
            });

            // Отправляем ответ только один раз
            await interaction.reply({ embeds: [subEmbed], ephemeral: true });
        }
    }
};