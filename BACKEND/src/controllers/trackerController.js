const mongoose = require("mongoose");
const Tracker = require("../models/Tracker");
const Hackathon = require("../models/Hackathon");

const fields = [
    "ideaSubmitted",
    "teamFormed",
    "problemStatementSelected",
    "prototypeStarted",
    "prototypeCompleted",
    "submissionCompleted",
    "presentationCompleted",
    "finalResult",
    "notes"
];

const createTracker = async (req, res) => {
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

        const existing = await Tracker.findOne({ user: req.user, hackathon });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "You already have a tracker for this hackathon"
            });
        }

        const data = { user: req.user, hackathon };
        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                data[field] = req.body[field];
            }
        });

        const tracker = await Tracker.create(data);

        res.status(201).json({
            success: true,
            message: "Tracker created successfully",
            tracker
        });
};

const getTrackers = async (req, res) => {
        const filter = {};

        if (req.query.all === "true") {
            if (req.role !== "admin") {
                return res.status(403).json({
                    success: false,
                    message: "Admin access required"
                });
            }
        } else {
            filter.user = req.user;
        }

        if (req.query.hackathon) {
            if (!mongoose.Types.ObjectId.isValid(req.query.hackathon)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid hackathon ID"
                });
            }
            filter.hackathon = req.query.hackathon;
        }

        const trackers = await Tracker.find(filter)
            .populate("hackathon", "title organizer status mode location startDate endDate")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: trackers.length,
            trackers
        });
};

const getTrackerById = async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid tracker ID"
            });
        }

        const tracker = await Tracker.findById(req.params.id).populate("hackathon", "title organizer status mode location startDate endDate");

        if (!tracker) {
            return res.status(404).json({
                success: false,
                message: "Tracker not found"
            });
        }

        if (tracker.user.toString() !== req.user && req.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You can only view your own trackers"
            });
        }

        res.json({
            success: true,
            tracker
        });
};

const updateTracker = async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid tracker ID"
            });
        }

        const tracker = await Tracker.findById(req.params.id);

        if (!tracker) {
            return res.status(404).json({
                success: false,
                message: "Tracker not found"
            });
        }

        if (tracker.user.toString() !== req.user && req.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You can only edit your own trackers"
            });
        }

        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                tracker[field] = req.body[field];
            }
        });

        await tracker.save();

        res.json({
            success: true,
            message: "Tracker updated successfully",
            tracker
        });
};

const deleteTracker = async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid tracker ID"
            });
        }

        const tracker = await Tracker.findById(req.params.id);

        if (!tracker) {
            return res.status(404).json({
                success: false,
                message: "Tracker not found"
            });
        }

        if (tracker.user.toString() !== req.user && req.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own trackers"
            });
        }

        await tracker.deleteOne();

        res.json({
            success: true,
            message: "Tracker deleted successfully"
        });
};

module.exports = {createTracker,getTrackers,getTrackerById,updateTracker,deleteTracker};