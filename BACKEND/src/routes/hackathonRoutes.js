const express = require("express");
const router = express.Router();

const {
    getHackathons,
    getHackathonById,
    createHackathon,
    updateHackathon,
    deleteHackathon,
    getRecommendedHackathons
} = require("../controllers/hackathonController");
const { auth } = require("../middleware/auth.middleware");

router.get("/recommended", auth, getRecommendedHackathons);
router.get("/", auth, getHackathons);
router.get("/:id", auth, getHackathonById);
router.post("/", auth, createHackathon);
router.put("/:id", auth, updateHackathon);
router.delete("/:id", auth, deleteHackathon);

module.exports = router;