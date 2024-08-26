const { Client, GatewayIntentBits, Partials, Collection, ActivityType, Intents, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const { readdirSync } = require("fs")
const axios = require('axios');
const mongoose = require("mongoose")
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
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
let lastStreamId
const twitchUsername = 'rostikfacekid';
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
let token = process.env.TOKEN

async function getTwitchAccessToken() {
  const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
          client_id: TWITCH_CLIENT_ID,
          client_secret: TWITCH_CLIENT_SECRET,
          grant_type: 'client_credentials'
      }
  });
  oauthToken = response.data.access_token;
  return response.data.access_token;
}

async function getUserId() {
  try {
      const response = await axios.get('https://api.twitch.tv/helix/users', {
          params: { login: twitchUsername },
          headers: {
              'Client-ID': TWITCH_CLIENT_ID,
              'Authorization': `Bearer ${await getTwitchAccessToken()}`
          }
      });
      return response.data.data[0].id;
  } catch (error) {
      console.error('Ошибка получения ID пользователя:', error);
  }
}

async function getStreamInfo() {
  const response = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${await getUserId()}`, {
      headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${await getTwitchAccessToken()}`
      }
  });
  return response.data.data[0] || null;
}

async function checkStream() {
  const streamInfo = await getStreamInfo();
  if (streamInfo && streamInfo.id !== lastStreamId) {
      lastStreamId = streamInfo.id;
      const channel = client.channels.cache.get(DISCORD_CHANNEL_ID);
      if (channel) {
          const embed = new EmbedBuilder()
              .setTitle(`${streamInfo.user_name} Сейчас в сети!`)
              .setDescription(`В данный момент играет в ${streamInfo.game_name}`)
              .addFields({ name: `${streamInfo.title}`, value: `[Вот ссылка на канал](https://twitch.tv/${streamInfo.user_login})` })
              .setURL(`https://www.twitch.tv/${streamInfo.user_name}`)
              .setImage(streamInfo.thumbnail_url.replace('{width}x{height}', '1280x700'))
              .setColor('Red');
          channel.send({ embeds: [embed] });
      }
  }
}

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
    mongoose.connect(process.env.URI_MONGO);
    setInterval(checkStream, 60000)
    client.user.setPresence({
      activities: [{ name: 'на женщин', type: 3 }],
      status: 'idle',
    });
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashcommands },
    );
  } catch (error) {
    console.error(error);
  }
})