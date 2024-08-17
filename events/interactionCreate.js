const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  ContextMenuCommandBuilder,
  Client,
  Collection,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  StringSelectMenuBuilder,
  InteractionType
} = require('discord.js');
require("dotenv/config")
const client = require("..");
const prefix = process.env.PREFIX;
client.on('interactionCreate', async interaction => {
    if (interaction.type == InteractionType.ApplicationCommand) {
      if (interaction.user.bot) return;
      try {
        const command = client.slashcommands.get(interaction.commandName)
        command.run(client, interaction)
      } catch {
        interaction.reply({
          content: "Код хуйня, переписывай нахуй",
          ephemeral: true
        })
      }
    }
})

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`Команда: ${interaction.commandName} не найдена.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
	},
};