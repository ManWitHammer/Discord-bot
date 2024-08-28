const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    twitchUsername: { type: String, required: true },
    discordChannelId: { type: String, required: true },
    guildId: { type: String, required: true },
    lastStreamId: { type: String, default: null }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;