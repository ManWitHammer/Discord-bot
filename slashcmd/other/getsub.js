const { SlashCommandBuilder } = require('@discordjs/builders')
const { EmbedBuilder } = require('discord.js')
const Subscription = require('../../models/sub.model.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getsubs')
        .setDescription('Показывает список подписанных каналов на этом сервере')
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName('platform')
                .setDescription('Выберите платформу')
                .setRequired(true)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    { name: 'Twitch', value: 'twitch' }
                )),

    run: async (client, interaction) => {
        const guildId = interaction.guildId
        const platform = interaction.options.getString('platform')
        
        // Ищем подписки по гильдии и платформе
        let subscription
        if (platform === 'twitch') {
            subscription = await Subscription.find({ guildId, twitchUsername: { $exists: true } })
        } else if (platform === 'youtube') {
            subscription = await Subscription.find({ guildId, youtubeChannelId: { $exists: true } })
        }

        if (subscription.length === 0) {
            // Отправляем ответ и завершаем выполнение
            return interaction.reply({ content: `Список подписанных каналов на платформе ${platform} пустой`, ephemeral: true })
        } else {
            const subEmbed = new EmbedBuilder()
                .setTitle(`Список подписок на уведомления (${platform})`)
                .setColor('Random')

            subscription.forEach((sub, index) => {
                if (platform === 'twitch') {
                    subEmbed.addFields(
                        { name: `${index + 1}. ${sub.twitchUsername}`, value: `[Вот ссылка канала](https://twitch.tv/${sub.twitchUsername})` }
                    )
                } else if (platform === 'youtube') {
                    subEmbed.addFields(
                        { name: `${index + 1}. ${sub.youtubeChannelName || "Без названия"}`, value: `[Вот ссылка канала](https://www.youtube.com/channel/${sub.youtubeChannelId})` }
                    )
                }
            })

            // Отправляем ответ только один раз
            await interaction.reply({ embeds: [subEmbed], ephemeral: true })
        }
    }
}