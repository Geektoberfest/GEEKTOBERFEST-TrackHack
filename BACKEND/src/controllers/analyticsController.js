const mongoose = require("mongoose");
const Tracker = require("../models/Tracker");
const Hackathon = require("../models/Hackathon");

const statuses = ["Upcoming", "Registered", "In Progress", "Completed", "Cancelled"];
const successfulResults = ["Participated", "Shortlisted", "Winner"];
const MONTHS_SHOWN = 12;

// the last 12 months in UTC, oldest first, e.g. ["2025-11", ..., "2026-10"]
const lastMonths = () => {
    const now = new Date();
    return Array.from({ length: MONTHS_SHOWN }, (_, index) => {
        const offset = MONTHS_SHOWN - 1 - index;
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1)).toISOString().slice(0, 7);
    });
};

// counts are done in MongoDB; the frontend gets ready-made numbers
const getAnalytics = async (req, res) => {
        const all = req.query.all === "true";

        if (all && req.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        // aggregate() does not cast strings to ObjectIds, so do it here
        const match = all ? {} : { user: new mongoose.Types.ObjectId(req.user) };
        const months = lastMonths();
        const firstMonth = new Date(months[0] + "-01T00:00:00Z");

        const [trackedCount, statusRows, monthRows, resultRows] = await Promise.all([
            Tracker.countDocuments(match),
            // status comes from the hackathon each tracker points at
            Tracker.aggregate([
                { $match: match },
                { $lookup: { from: Hackathon.collection.name, localField: "hackathon", foreignField: "_id", as: "event" } },
                { $unwind: "$event" },
                { $group: { _id: "$event.status", count: { $sum: 1 } } }
            ]),
            Tracker.aggregate([
                { $match: { ...match, createdAt: { $gte: firstMonth } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, count: { $sum: 1 } } }
            ]),
            Tracker.aggregate([
                { $match: match },
                { $group: { _id: "$finalResult", count: { $sum: 1 } } }
            ])
        ]);

        const successful = resultRows
            .filter((row) => successfulResults.includes(row._id))
            .reduce((sum, row) => sum + row.count, 0);

        const statusCounts = statuses.map((status) => {
            const row = statusRows.find((item) => item._id === status);
            return { status, count: row ? row.count : 0 };
        });

        const monthly = months.map((month) => {
            const row = monthRows.find((item) => item._id === month);
            return { month, count: row ? row.count : 0 };
        });

        res.json({
            success: true,
            scope: all ? "all" : "me",
            totals: {
                tracked: trackedCount,
                successful,
                // null when there is nothing to measure yet, so the UI can show a dash
                successRate: trackedCount > 0 ? Math.round((successful / trackedCount) * 100) : null
            },
            statusCounts,
            monthly
        });
};

module.exports = { getAnalytics };
