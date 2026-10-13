const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const Bookmark = require("../models/Bookmark");

const fields = ["title","description","organizer","startDate","endDate","registrationDeadline","location","mode","status","website"];

const statuses = ["Upcoming", "Registered", "In Progress", "Completed", "Cancelled"];
const modes = ["Online", "Offline", "Hybrid"];

const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    startDate: { startDate: 1 },
    "-startDate": { startDate: -1 },
    deadline: { registrationDeadline: 1 },
    title: { title: 1 }
};

const MAX_LIMIT = 50;

// escape special characters so the keyword is matched as plain text
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "Upcoming,Completed" -> ["Upcoming", "Completed"]
const toList = (value) => String(value).split(",").map((item) => item.trim()).filter(Boolean);

const parseDate = (value, endOfDay) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return null;
    }
    // a plain date like 2026-10-31 should include that whole day
    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        date.setUTCHours(23, 59, 59, 999);
    }
    return date;
};

const getHackathons = async (req, res) => {
        const { search, status, mode, mine, startFrom, startTo, sort, page, limit } = req.query;
        const filter = {};

        if (typeof search === "string" && search.trim()) {
            const keyword = new RegExp(escapeRegex(search.trim()), "i");
            filter.$or = [
                { title: keyword },
                { organizer: keyword },
                { description: keyword },
                { location: keyword }
            ];
        }

        if (status) {
            const list = toList(status);
            if (list.some((item) => !statuses.includes(item))) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Allowed: " + statuses.join(", ")
                });
            }
            filter.status = { $in: list };
        }

        if (mode) {
            const list = toList(mode);
            if (list.some((item) => !modes.includes(item))) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid mode. Allowed: " + modes.join(", ")
                });
            }
            filter.mode = { $in: list };
        }

        if (startFrom || startTo) {
            const from = startFrom ? parseDate(startFrom, false) : null;
            const to = startTo ? parseDate(startTo, true) : null;

            if ((startFrom && !from) || (startTo && !to)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date. Use the format YYYY-MM-DD"
                });
            }

            if (from && to && from > to) {
                return res.status(400).json({
                    success: false,
                    message: "startFrom cannot be after startTo"
                });
            }

            filter.startDate = {};
            if (from) {
                filter.startDate.$gte = from;
            }
            if (to) {
                filter.startDate.$lte = to;
            }
        }

        if (mine === "true") {
            filter.createdBy = req.user;
        }

        if (sort && !sortOptions[sort]) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort. Allowed: " + Object.keys(sortOptions).join(", ")
            });
        }
        // _id as a tie-breaker keeps the order stable between pages
        const sortBy = { ...sortOptions[sort || "newest"], _id: 1 };

        let query = Hackathon.find(filter).populate("createdBy", "name").sort(sortBy);

        // pagination is only applied when page or limit is sent, so existing callers still get every result
        const paginate = page !== undefined || limit !== undefined;
        let pageNumber = 1;
        let pageSize = 0;

        if (paginate) {
            pageNumber = Number(page || 1);
            pageSize = Number(limit || 10);

            if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
                return res.status(400).json({
                    success: false,
                    message: "page and limit must be positive whole numbers"
                });
            }

            pageSize = Math.min(pageSize, MAX_LIMIT);
            query = query.skip((pageNumber - 1) * pageSize).limit(pageSize);
        }

        const [hackathons, total] = await Promise.all([query, Hackathon.countDocuments(filter)]);

        res.json({
            success: true,
            count: hackathons.length,
            total,
            page: pageNumber,
            totalPages: paginate ? Math.max(1, Math.ceil(total / pageSize)) : 1,
            hackathons
        });
};

const getHackathonById = async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hackathon ID"
            });
        }

        const hackathon = await Hackathon.findById(req.params.id).populate("createdBy", "name");

        if (!hackathon) {
            return res.status(404).json({
                success: false,
                message: "Hackathon not found"
            });
        }

        res.json({
            success: true,
            hackathon
        });
};

const createHackathon = async (req, res) => {
        const { title, organizer, startDate, endDate } = req.body;

        if (!title || !organizer) {
            return res.status(400).json({
                success: false,
                message: "Title and organizer are required"
            });
        }

        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({
                success: false,
                message: "End date cannot be before start date"
            });
        }

        const data = {};
        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                data[field] = req.body[field];
            }
        });
        data.createdBy = req.user;

        const hackathon = await Hackathon.create(data);

        res.status(201).json({
            success: true,
            message: "Hackathon created successfully",
            hackathon
        });
};

const updateHackathon = async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hackathon ID"
            });
        }

        const hackathon = await Hackathon.findById(req.params.id);

        if (!hackathon) {
            return res.status(404).json({
                success: false,
                message: "Hackathon not found"
            });
        }

        if (hackathon.createdBy.toString() !== req.user && req.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You can only edit hackathons you created"
            });
        }

        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                hackathon[field] = req.body[field];
            }
        });

        if (hackathon.startDate && hackathon.endDate && hackathon.endDate < hackathon.startDate) {
            return res.status(400).json({
                success: false,
                message: "End date cannot be before start date"
            });
        }

        await hackathon.save();

        res.json({
            success: true,
            message: "Hackathon updated successfully",
            hackathon
        });
};

const deleteHackathon = async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hackathon ID"
            });
        }

        const hackathon = await Hackathon.findById(req.params.id);

        if (!hackathon) {
            return res.status(404).json({
                success: false,
                message: "Hackathon not found"
            });
        }

        if (hackathon.createdBy.toString() !== req.user && req.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You can only delete hackathons you created"
            });
        }

        await hackathon.deleteOne();
        // remove saved entries that point at this hackathon so none are left broken
        await Bookmark.deleteMany({ hackathon: hackathon._id });

        res.json({
            success: true,
            message: "Hackathon deleted successfully"
        });
};

module.exports = {getHackathons,getHackathonById,createHackathon,updateHackathon,deleteHackathon};