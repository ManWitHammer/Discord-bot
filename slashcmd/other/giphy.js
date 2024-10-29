const { SlashCommandBuilder} = require("@discordjs/builders")
require("dotenv/config")

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`gifhy`)
    .setDescription(`Рандомные гифки из сайта giphy`),

    run: async (client, interaction) => {
        fetch(`https://api.giphy.com/v1/gifs/random?api_key=${process.env.GIPHY_API_KEY}&tag=&rating=g`)
        .then(response => response.json())
        .then(data => {
            interaction.reply(data.data.url);
        })
        .catch(() => {
            interaction.reply(`Увы, но нам не удалось найти гифку:(`);
    });
    
}}