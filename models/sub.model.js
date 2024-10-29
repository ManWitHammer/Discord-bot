const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    twitchUsername: { type: String, required: false },
    youtubeChannelId: { type: String, required: false },
    youtubeChannelName: { type: String, required: false },
    discordChannelId: { type: String, required: true },
    guildId: { type: String, required: true },
    lastStreamId: { type: String, required: false },
    lastVideoId: { type: String, default: null, required: false }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;