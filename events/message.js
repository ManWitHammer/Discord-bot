const { EmbedBuilder, Events } = require("discord.js");
require("dotenv/config");
const client = require("..");
const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const BadWords = require('../models/badWords.model.js');
const prefix = process.env.PREFIX;

client.on("messageCreate", async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;

    // Проверка сообщения на наличие плохих слов
    const badWordsEntry = await BadWords.findOne({ guildId: message.guild.id });
    if (badWordsEntry) {
        const badWords = badWordsEntry.badWords;
        const lowerCaseMessage = message.content.toLowerCase();

        for (const badWord of badWords) {
            if (lowerCaseMessage.includes(badWord.toLowerCase())) {
                await message.delete();
                return message.channel.send(`${message.author}, ваше сообщение было удалено, так как оно содержит запрещенные слова.`);
            }
        }
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if (cmd.length == 0) return;
    
    let command = client.commands.get(cmd);
    if (!command) command = client.commands.get(client.commandaliases.get(cmd));
    if (command) {
        command.run(client, message, args);
    }

    // Если команда существует
    if (client.commands.get(command)) {
        try {
            cmd = client.commands.get(command);
        } catch (error) {
            message.delete();
            message.reply(`Произошла ошибка при обработке вашей команды. Попробуйте позднее.\nСообщение: \`${message.content}\``)
                .then(m => m.delete({ timeout: 5000 }));
            throw error;
        }
    }
});