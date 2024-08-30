const mongoose = require('mongoose');

const badWordsSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    badWords: {
        type: [String],
        required: true,
        default: []
    }
});

module.exports = mongoose.model('BadWord', badWordsSchema);