const mongoose = require("mongoose");

const teamInviteSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

teamInviteSchema.index({ invitedUser: 1, status: 1 });
teamInviteSchema.index({ team: 1 });

module.exports = mongoose.model("TeamInvite", teamInviteSchema);
