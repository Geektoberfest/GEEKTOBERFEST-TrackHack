const express = require("express");
const router = express.Router();

const {
    createTracker,
    getTrackers,
    getTrackerById,
    updateTracker,
    deleteTracker
} = require("../controllers/trackerController");
const { auth } = require("../middleware/auth.middleware");

router.post("/", auth, createTracker);
router.get("/", auth, getTrackers);
router.get("/:id", auth, getTrackerById);
router.put("/:id", auth, updateTracker);
router.delete("/:id", auth, deleteTracker);

module.exports = router;