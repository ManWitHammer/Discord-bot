const {EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, TextInputStyle, ButtonStyle, ActionRowBuilder, Events} = require("discord.js");
const { SlashCommandBuilder} = require("@discordjs/builders");
const client1 = require("../../index");

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`gifhy`)
    .setDescription(`Рандомные гифки из сайта giphy`),

run: async (client, interaction, message) => {
    fetch('https://api.giphy.com/v1/gifs/random?api_key=Nn54Pa9miPavjBZLu5y26NyasvOYMhEs&tag=&rating=g')
    .then(response => response.json())
    .then(data => {
        console.log(data.data.url);
        interaction.reply(data.data.url);
    })
    .catch(error => {
        interaction.reply(`Увы, но нам не удалось найти гифку:(`);
    });
    
}}