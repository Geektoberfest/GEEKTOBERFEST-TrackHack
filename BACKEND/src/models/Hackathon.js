const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    organizer: {
        type: String,
        required: [true, "Organizer is required"],
        trim: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    registrationDeadline: {
        type: Date
    },
    location: {
        type: String,
        trim: true,
        default: ""
    },
    mode: {
        type: String,
        enum: ["Online", "Offline", "Hybrid"],
        default: "Online"
    },
    status: {
        type: String,
        enum: ["Upcoming", "Registered", "In Progress", "Completed", "Cancelled"],
        default: "Upcoming"
    },
    website: {
        type: String,
        trim: true,
        default: ""
    },
    tags: {
        type: [String],
        default: []
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Hackathon", hackathonSchema);