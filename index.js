const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const fs = require("fs");
const { readdirSync } = require("fs")
require("dotenv/config")
const client = new Client({
  partials: [
    Partials.Message, // for message
    Partials.Channel, // for text channel
    Partials.GuildMember, // for guild member
    Partials.Reaction, // for message reaction
    Partials.GuildScheduledEvent, // for guild events
    Partials.User, // for discord user
    Partials.ThreadMember, // for thread member
  ],
  intents: [
    GatewayIntentBits.Guilds, // for guild related things
    GatewayIntentBits.GuildMembers, // for guild members related things
    GatewayIntentBits.GuildBans, // for manage guild bans
    GatewayIntentBits.GuildEmojisAndStickers, // for manage emojis and stickers
    GatewayIntentBits.GuildIntegrations, // for discord Integrations
    GatewayIntentBits.GuildWebhooks, // for discord webhooks
    GatewayIntentBits.GuildInvites, // for guild invite managing
    GatewayIntentBits.GuildVoiceStates, // for voice related things
    GatewayIntentBits.GuildPresences, // for user presence things
    GatewayIntentBits.GuildMessages, // for guild messages things
    GatewayIntentBits.GuildMessageReactions, // for message reactions things
    GatewayIntentBits.GuildMessageTyping, // for message typing things
    GatewayIntentBits.DirectMessages, // for dm messages
    GatewayIntentBits.DirectMessageReactions, // for dm message reaction
    GatewayIntentBits.DirectMessageTyping, // for dm message typinh
    GatewayIntentBits.MessageContent, // enable if you need message content things
  ],
});
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
let token = process.env.TOKEN

module.exports = client;
client.commands = new Collection()
client.slashcommands = new Collection()
client.commandaliases = new Collection()
const commands = []
readdirSync('./commands').forEach(async file => {
  const command = await require(`./commands/${file}`);
  if (command) {
    client.commands.set(command.name, command)
    commands.push(command.name, command);
    if (command.aliases && Array.isArray(command.aliases)) {
      command.aliases.forEach(alias => {
        client.commandaliases.set(alias, command.name)
      })
    }
  }
})

//slash-command-handler
const slashcommands = [];
fs.readdirSync('./slashcmd/').forEach(folder => {
  const commands = fs.readdirSync(`./slashcmd/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commands) {
    const command = require(`./slashcmd/${folder}/${file}`);
  slashcommands.push(command.data.toJSON());
  client.slashcommands.set(command.data.name, command);
}})
require("./events/message.js")
require("./events/ready.js")
require("./events/interactionCreate.js")
//require("./events/ifselectmenu.js")
//require("./events/ifbutton.js")
//require("./events/guildMemberAdd.js")
//require("./events/guildMemberRemove.js")
//require("./events/guildMemberUpdate.js")
//require("./events/inviteCreate.js")

client.login(process.env.TOKEN).catch(e => {
  console.log("инет упал")
})
const rest = new REST({ version: '10' }).setToken(token);
client.on("ready", async () => {
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashcommands },
    );
  } catch (error) {
    console.error(error);
  }
})