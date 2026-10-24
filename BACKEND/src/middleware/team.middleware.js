const mongoose = require("mongoose");
const Team = require("../models/Team");

// Loads the team from :id and checks the logged-in user's role in it.
// Call with no roles to allow any member; otherwise only the listed roles pass.
const requireTeamRole = (...roles) => async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid team ID"
        });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
        return res.status(404).json({
            success: false,
            message: "Team not found"
        });
    }

    const membership = team.members.find((member) => member.user.toString() === req.user);

    if (!membership) {
        return res.status(403).json({
            success: false,
            message: "You are not a member of this team"
        });
    }

    if (roles.length > 0 && !roles.includes(membership.role)) {
        return res.status(403).json({
            success: false,
            message: "Your team role does not allow this action"
        });
    }

    req.team = team;
    req.membership = membership;
    next();
};

module.exports = { requireTeamRole };
