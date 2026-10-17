const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const hackathonRoutes = require("./routes/hackathonRoutes");
const trackerRoutes = require("./routes/trackerRoutes");
const githubRoutes = require("./routes/githubRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const adminRoutes = require("./routes/adminRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "HackTrack API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/trackers", trackerRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teams", teamRoutes);

module.exports = app;
