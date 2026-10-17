const express = require("express");
const router = express.Router();

const { getAnalytics } = require("../controllers/analyticsController");
const { auth } = require("../middleware/auth.middleware");

// GET /api/analytics/me, or /me?all=true for admins (all users)
router.get("/me", auth, getAnalytics);

module.exports = router;
