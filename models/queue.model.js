const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    voiceChannelId: { type: String, required: true },
    queue: { type: [{ 
        user: String,
        title: String,
        url: String
    }], default: [] },
});

queueSchema.index({ guildId: 1, voiceChannelId: 1 }, { unique: true });

const Queue = mongoose.model('queue', queueSchema);

module.exports = Queue;