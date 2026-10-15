const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    hackathon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hackathon",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// the same hackathon can only be saved once per user
bookmarkSchema.index({ user: 1, hackathon: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
