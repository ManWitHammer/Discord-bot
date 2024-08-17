const {EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, TextInputStyle, ButtonStyle, ActionRowBuilder, Events} = require("discord.js");
const { SlashCommandBuilder} = require("@discordjs/builders");
const client1 = require("../../index");

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`myip`)
    .setDescription(`Получает айпи пользователя`),

run: async (client, interaction, message) => {

    fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => {
        // interaction.reply(`Ваш IP-адрес: ${data.ip}`);
        interaction.reply(`Технический перерыв`);
        console.log(interaction.user.username)
        console.log('Ваш IP-адрес:', data.ip);
    })
    .catch(err => {
        interaction.reply(`Ошибка при получении IP-адреса`);
    });
}}