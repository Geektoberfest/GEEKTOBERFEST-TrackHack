const mongoose = require("mongoose");
const Bookmark = require("../models/Bookmark");
const Hackathon = require("../models/Hackathon");

const getBookmarks = async (req, res) => {
        const bookmarks = await Bookmark.find({ user: req.user })
            .sort({ createdAt: -1 })
            .populate({ path: "hackathon", populate: { path: "createdBy", select: "name" } });

        // skip bookmarks whose hackathon was deleted by someone else
        const hackathons = bookmarks.filter((bookmark) => bookmark.hackathon).map((bookmark) => bookmark.hackathon);

        res.json({
            success: true,
            count: hackathons.length,
            hackathons
        });
};

const createBookmark = async (req, res) => {
        const { hackathon } = req.body;

        if (!hackathon || !mongoose.Types.ObjectId.isValid(hackathon)) {
            return res.status(400).json({
                success: false,
                message: "A valid hackathon ID is required"
            });
        }

        const hackathonExists = await Hackathon.findById(hackathon);
        if (!hackathonExists) {
            return res.status(404).json({
                success: false,
                message: "Hackathon not found"
            });
        }

        const existing = await Bookmark.findOne({ user: req.user, hackathon });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "This hackathon is already saved"
            });
        }

        const bookmark = await Bookmark.create({ user: req.user, hackathon });

        res.status(201).json({
            success: true,
            message: "Hackathon saved",
            bookmark
        });
};

const deleteBookmark = async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.hackathonId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hackathon ID"
            });
        }

        // filter by user so people can only remove their own bookmarks
        const bookmark = await Bookmark.findOneAndDelete({ user: req.user, hackathon: req.params.hackathonId });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                message: "Saved hackathon not found"
            });
        }

        res.json({
            success: true,
            message: "Hackathon removed from saved list"
        });
};

module.exports = {
    getBookmarks,
    createBookmark,
    deleteBookmark
};
