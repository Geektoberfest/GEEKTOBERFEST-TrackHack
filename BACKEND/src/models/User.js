const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
        select: false
    },
    githubUsername: {
        type: String,
        trim: true,
        default: ""
    },
    skills: {
        type: [String],
        default: []
    },
    interests: {
        type: [String],
        default: []
    },
    preferredModes: {
        type: [String],
        enum: ["Online", "Offline", "Hybrid"],
        default: []
    },
    preferredLocation: {
        type: String,
        trim: true,
        default: ""
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);