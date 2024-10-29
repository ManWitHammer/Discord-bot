const client = require("../index");
const { progressBar } = require('../modules/preloader');
const {
	Collection,
	InteractionCollector,
	EmbedBuilder,
	Events,
	StringSelectMenuOptionBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	SelectMenuBuilder,
	ButtonBuilder,
	ButtonStyle,
	interaction
} = require("discord.js")
const fs = require("fs");
//const testfile = require('../modules/test')

client.on("ready", async (client, message, interaction) => {
	progressBar.update(4, { message: "Всё загружено. " + client.user.username + " работает" })
	console.log("\n ЗА РАБОТУ!\r")
	//await testfile.test()
});

