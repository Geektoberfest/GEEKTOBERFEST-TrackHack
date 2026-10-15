const express = require("express");
const router = express.Router();

const {
    getBookmarks,
    createBookmark,
    deleteBookmark
} = require("../controllers/bookmarkController");
const { auth } = require("../middleware/auth.middleware");

router.get("/", auth, getBookmarks);
router.post("/", auth, createBookmark);
router.delete("/:hackathonId", auth, deleteBookmark);

module.exports = router;
