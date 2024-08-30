const client = require("../index");
const { startPreloader, stopPreloader, updateConsoleLog } = require('../modules/preloader');
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
const preloader = startPreloader(); 
//const testfile = require('../modules/test')

client.on("ready", async (client, message, interaction) => {
	stopPreloader(preloader)
	updateConsoleLog(100, "Всё загружено. " + client.user.username + " работает")
	//await testfile.test()
});

