const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    notifications: { type: [{ 
        reason: String,
        date: Date
    }], default: [] },
});

const Notice = mongoose.model('notification', noticeSchema);

module.exports = Notice;