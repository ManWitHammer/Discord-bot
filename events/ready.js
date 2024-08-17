const client = require("../index");
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
	console.log(client.user.username + " работает");
	//await testfile.test()
});

