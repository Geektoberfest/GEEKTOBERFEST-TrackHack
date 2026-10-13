const { getUserProfile, getUserRepos, getUserStats } = require("../services/githubService");

// GitHub usernames: letters, numbers and single hyphens, max 39 characters
const usernamePattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

const checkUsername = (req, res) => {
    if (!usernamePattern.test(req.params.username)) {
        res.status(400).json({
            success: false,
            message: "Invalid GitHub username"
        });
        return false;
    }
    return true;
};

const getProfile = async (req, res) => {
    if (!checkUsername(req, res)) {
        return;
    }

    try {
        const profile = await getUserProfile(req.params.username);

        res.json({
            success: true,
            profile
        });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getRepos = async (req, res) => {
    if (!checkUsername(req, res)) {
        return;
    }

    try {
        const repos = await getUserRepos(req.params.username);

        res.json({
            success: true,
            count: repos.length,
            repos
        });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getStats = async (req, res) => {
    if (!checkUsername(req, res)) {
        return;
    }

    try {
        const stats = await getUserStats(req.params.username);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getProfile,
    getRepos,
    getStats
};
