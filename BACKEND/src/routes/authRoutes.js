const express = require("express");
const router = express.Router();

const { register, login, getMe, updateMe } = require("../controllers/authController");
const { auth } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getMe);
router.put("/me", auth, updateMe);

module.exports = router;