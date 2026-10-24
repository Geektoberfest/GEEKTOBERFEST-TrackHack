const mongoose = require("mongoose");
const User = require("../models/User");
const Tracker = require("../models/Tracker");
const Bookmark = require("../models/Bookmark");
const { removeUserFromTeams } = require("../services/teamService");

const listUsers = async (req, res) => {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json({
        success: true,
        count: users.length,
        users
    });
};

const updateUserRole = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    const { role } = req.body;
    if (role !== "user" && role !== "admin") {
        return res.status(400).json({
            success: false,
            message: "Role must be either user or admin"
        });
    }

    if (req.params.id === req.user) {
        return res.status(403).json({
            success: false,
            message: "You cannot change your own role"
        });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    user.role = role;
    await user.save();

    res.json({
        success: true,
        message: "User role updated successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            githubUsername: user.githubUsername,
            role: user.role,
            skills: user.skills || [],
            interests: user.interests || [],
            preferredModes: user.preferredModes || [],
            preferredLocation: user.preferredLocation || ""
        }
    });
};

const deleteUser = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    if (req.params.id === req.user) {
        return res.status(403).json({
            success: false,
            message: "You cannot delete your own account"
        });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    // Remove the user's trackers; hackathons they created are kept so other
    // participants keep their history (createdBy resolves to "Unknown").
    await Tracker.deleteMany({ user: user._id });
    await Bookmark.deleteMany({ user: user._id });
    // leave their teams (keeping each one owned) and drop their invites
    await removeUserFromTeams(user._id);
    await user.deleteOne();

    res.json({
        success: true,
        message: "User deleted successfully"
    });
};

module.exports = { listUsers, updateUserRole, deleteUser };
