const { EmbedBuilder, Events } = require("discord.js");
require("dotenv/config")
const client = require("..");
const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const prefix = process.env.PREFIX;
client.on("messageCreate", async (message) => {
	if (!message.guild) return;
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const cmd = args.shift().toLowerCase();
	if (cmd.length == 0) return;
	let command = client.commands.get(cmd)
	if (!command) command = client.commands.get(client.commandaliases.get(cmd));
	if (command) {
		command.run(client, message, args)
	}
	// let command = message.content.split(" ")[0].slice(prefix.length);
	// let params = message.content.split(" ").slice(1);
	// let cmd;
	if (client.commands.get(command)) {
		try {
			cmd = client.commands.get(command);
		} catch (error) {
			message.delete();
			message.reply(`произошла ошибка при обработке твоей команды. Попробуй позднее.\nСообщение: \`${message}\``)
				.then(m => m.delete({ timeout: 5000 }))
			throw error;
		}
	}


});
