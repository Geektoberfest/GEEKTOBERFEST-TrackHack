const express = require("express");
const router = express.Router();

const { getProfile, getRepos } = require("../controllers/githubController");
const { auth } = require("../middleware/auth.middleware");

router.get("/profile/:username", auth, getProfile);
router.get("/repos/:username", auth, getRepos);

module.exports = router;