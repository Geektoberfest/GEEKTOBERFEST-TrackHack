const express = require("express");
const router = express.Router();

const { getProfile, getRepos, getStats } = require("../controllers/githubController");
const { auth } = require("../middleware/auth.middleware");

router.get("/profile/:username", auth, getProfile);
router.get("/repos/:username", auth, getRepos);
router.get("/stats/:username", auth, getStats);

module.exports = router;