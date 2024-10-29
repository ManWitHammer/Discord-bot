const { Client, GatewayIntentBits, Partials, Collection, ActivityType, Intents, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const { readdirSync } = require("fs")
const axios = require('axios');
const mongoose = require("mongoose")
const Subscription = require('./models/sub.model.js');
const keepAlive = require("./server.js")
const { progressBar } = require("./modules/preloader.js")
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
})

const YOUTUBE_API_KEY = process.env.GOOGLE_API_KEY

// Fetch the latest video from a YouTube channel by channel ID
async function getLatestYouTubeVideo(channelId) {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        channelId: channelId,
        order: 'date',
        maxResults: 1,
        type: 'video',
        key: YOUTUBE_API_KEY
      }
    });
    
    const video = response.data.items[0];
    if (video) {
      return {
        title: video.snippet.title,
        videoId: video.id.videoId,
        thumbnail: video.snippet.thumbnails.high.url
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching latest YouTube video:', error);
    return null;
  }
}

// Function to check YouTube channel and notify for a new video
async function checkYouTubeVideos() {
  const subscriptions = await Subscription.find();

  for (const sub of subscriptions) {
    if (!sub.youtubeChannelId) continue;

    const latestVideo = await getLatestYouTubeVideo(sub.youtubeChannelId);
    if (latestVideo && latestVideo.videoId !== sub.lastVideoId) {
      sub.lastVideoId = latestVideo.videoId;
      await sub.save();

      const channel = client.channels.cache.get(sub.discordChannelId);
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(`Новое видео на канале ${sub.youtubeChannelName}!`)
          .setDescription(latestVideo.title)
          .setURL(`https://www.youtube.com/watch?v=${latestVideo.videoId}`)
          .setImage(latestVideo.thumbnail)
          .setColor('Red');
        channel.send({ embeds: [embed] });
      }
    }
  }
}

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
let token = process.env.TOKEN;

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

async function getStreamInfo(twitchUsername) {
  const response = await axios.get('https://api.twitch.tv/helix/streams', {
      params: { user_login: twitchUsername },
      headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${await getTwitchAccessToken()}`
      }
  });
  return response.data.data[0] || null;
}

async function checkStreams() {
  const subscriptions = await Subscription.find();

  for (const sub of subscriptions) {
      // Проверка, есть ли у документа имя пользователя Twitch
      if (!sub.twitchUsername) continue;

      const streamInfo = await getStreamInfo(sub.twitchUsername);
      if (streamInfo && streamInfo.id !== sub.lastStreamId) {
          sub.lastStreamId = streamInfo.id;
          await sub.save();

          const channel = client.channels.cache.get(sub.discordChannelId);
          if (channel) {
              const embed = new EmbedBuilder()
                  .setTitle(`${streamInfo.user_name} Сейчас в сети!`)
                  .setDescription(`В данный момент играет в ${streamInfo.game_name}`)
                  .addFields({ name: `${streamInfo.title}`, value: `[Вот ссылка на канал](https://twitch.tv/${streamInfo.user_login})` })
                  .setURL(`https://www.twitch.tv/${streamInfo.user_name}`)
                  .setImage(streamInfo.thumbnail_url.replace('{width}x{height}', '1280x700'))
                  .setColor('Purple');
              channel.send({ embeds: [embed] });
          }
      }
  }
}

module.exports = client;
client.commands = new Collection();
client.slashcommands = new Collection();
client.commandaliases = new Collection();
const commands = [];

readdirSync('./commands').forEach(async file => {
  const command = await require(`./commands/${file}`);
  if (command) {
    client.commands.set(command.name, command);
    commands.push(command.name, command);
    if (command.aliases && Array.isArray(command.aliases)) {
      command.aliases.forEach(alias => {
        client.commandaliases.set(alias, command.name);
      });
    }
  }
});

// Slash command handler
const slashcommands = [];
fs.readdirSync('./slashcmd/').forEach(folder => {
  const commands = fs.readdirSync(`./slashcmd/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commands) {
    const command = require(`./slashcmd/${folder}/${file}`);
    slashcommands.push(command.data.toJSON());
    client.slashcommands.set(command.data.name, command);
  }
});

// Event handlers
require("./events/message.js");
require("./events/ready.js");
require("./events/interactionCreate.js");

progressBar.update(1, { message: "Запускаю сервер для бота..." });
keepAlive();

mongoose.connect(process.env.URI_MONGO)
  .then(() => {
    progressBar.update(3, { message: "Запускаю самого бота..." });
    
    client.login(process.env.TOKEN).catch(e => {
      console.log("инет упал");
    });
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));

const rest = new REST({ version: '10' }).setToken(token);
client.on("ready", async () => {
  try {
    setInterval(checkStreams, 5 * 60000);
    setInterval(checkYouTubeVideos, 5 * 60000);
    client.user.setPresence({
      activities: [{ name: 'на вас! (=^-ω-^=)', type: ActivityType.Watching }],
      status: 'idle',
    });
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashcommands },
    );
  } catch (error) {
    console.error(error);
  } finally {
    progressBar.stop()
  }
})