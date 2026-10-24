const mongoose = require("mongoose");
const Team = require("../models/Team");
const TeamInvite = require("../models/TeamInvite");
const User = require("../models/User");
const Hackathon = require("../models/Hackathon");
const { deleteTeamCascade } = require("../services/teamService");

const roles = ["owner", "admin", "member"];
const MAX_NAME_LENGTH = 60;

const countOwners = (team) => team.members.filter((member) => member.role === "owner").length;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getMyTeams = async (req, res) => {
    const teams = await Team.find({ "members.user": req.user }).sort({ createdAt: -1 });

    res.json({
        success: true,
        count: teams.length,
        teams: teams.map((team) => ({
            _id: team._id,
            name: team.name,
            memberCount: team.members.length,
            myRole: team.members.find((member) => member.user.toString() === req.user).role
        }))
    });
};

const createTeam = async (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Team name is required"
        });
    }

    if (name.length > MAX_NAME_LENGTH) {
        return res.status(400).json({
            success: false,
            message: `Team name must be ${MAX_NAME_LENGTH} characters or fewer`
        });
    }

    // the creator starts as the owner
    const team = await Team.create({
        name,
        createdBy: req.user,
        members: [{ user: req.user, role: "owner" }]
    });

    res.status(201).json({
        success: true,
        message: "Team created successfully",
        team
    });
};

const getTeamById = async (req, res) => {
    const team = await Team.findById(req.team._id).populate("members.user", "name email githubUsername");

    const canManage = req.membership.role === "owner" || req.membership.role === "admin";
    const invites = canManage
        ? await TeamInvite.find({ team: team._id, status: "pending" }).populate("invitedUser", "name email")
        : [];

    res.json({
        success: true,
        myRole: req.membership.role,
        team,
        invites
    });
};

const deleteTeam = async (req, res) => {
    await deleteTeamCascade(req.team._id);

    res.json({
        success: true,
        message: "Team deleted successfully"
    });
};

const inviteMember = async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "No user found with that email"
        });
    }

    if (req.team.members.some((member) => member.user.toString() === user._id.toString())) {
        return res.status(400).json({
            success: false,
            message: "That user is already a member of this team"
        });
    }

    const pending = await TeamInvite.findOne({ team: req.team._id, invitedUser: user._id, status: "pending" });
    if (pending) {
        return res.status(400).json({
            success: false,
            message: "That user already has a pending invite"
        });
    }

    const invite = await TeamInvite.create({
        team: req.team._id,
        invitedUser: user._id,
        invitedBy: req.user
    });

    res.status(201).json({
        success: true,
        message: "Invite sent",
        invite
    });
};

const getMyInvites = async (req, res) => {
    const invites = await TeamInvite.find({ invitedUser: req.user, status: "pending" })
        .populate("team", "name")
        .populate("invitedBy", "name")
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: invites.length,
        invites
    });
};

// Finds a pending invite addressed to the logged-in user, or responds with an error
const findMyPendingInvite = async (req, res) => {
    if (!isValidId(req.params.inviteId)) {
        res.status(400).json({
            success: false,
            message: "Invalid invite ID"
        });
        return null;
    }

    const invite = await TeamInvite.findOne({ _id: req.params.inviteId, invitedUser: req.user, status: "pending" });
    if (!invite) {
        res.status(404).json({
            success: false,
            message: "Invite not found"
        });
        return null;
    }

    return invite;
};

const acceptInvite = async (req, res) => {
    const invite = await findMyPendingInvite(req, res);
    if (!invite) {
        return;
    }

    const team = await Team.findById(invite.team);
    if (!team) {
        // the team was deleted after the invite was sent
        await invite.deleteOne();
        return res.status(404).json({
            success: false,
            message: "Team no longer exists"
        });
    }

    const alreadyMember = team.members.some((member) => member.user.toString() === req.user);
    if (!alreadyMember) {
        team.members.push({ user: req.user, role: "member" });
        await team.save();
    }

    invite.status = "accepted";
    await invite.save();

    res.json({
        success: true,
        message: "Invite accepted",
        team: { _id: team._id, name: team.name }
    });
};

const declineInvite = async (req, res) => {
    const invite = await findMyPendingInvite(req, res);
    if (!invite) {
        return;
    }

    invite.status = "declined";
    await invite.save();

    res.json({
        success: true,
        message: "Invite declined"
    });
};

const leaveTeam = async (req, res) => {
    const membership = req.membership;

    if (membership.role === "owner" && countOwners(req.team) === 1) {
        return res.status(400).json({
            success: false,
            message: "Make another member an owner before leaving this team"
        });
    }

    req.team.members = req.team.members.filter((member) => member._id.toString() !== membership._id.toString());
    await req.team.save();

    res.json({
        success: true,
        message: "You left the team"
    });
};

const updateMemberRole = async (req, res) => {
    if (!isValidId(req.params.userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    const { role } = req.body;
    if (!roles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Role must be owner, admin or member"
        });
    }

    const target = req.team.members.find((member) => member.user.toString() === req.params.userId);
    if (!target) {
        return res.status(404).json({
            success: false,
            message: "Member not found"
        });
    }

    // a team must always keep at least one owner
    if (target.role === "owner" && role !== "owner" && countOwners(req.team) === 1) {
        return res.status(400).json({
            success: false,
            message: "A team must keep at least one owner"
        });
    }

    target.role = role;
    await req.team.save();

    res.json({
        success: true,
        message: "Member role updated"
    });
};

const removeMember = async (req, res) => {
    if (!isValidId(req.params.userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    if (req.params.userId === req.user) {
        return res.status(400).json({
            success: false,
            message: "Use leave to exit the team"
        });
    }

    const target = req.team.members.find((member) => member.user.toString() === req.params.userId);
    if (!target) {
        return res.status(404).json({
            success: false,
            message: "Member not found"
        });
    }

    // admins can only remove plain members
    if (req.membership.role === "admin" && target.role !== "member") {
        return res.status(403).json({
            success: false,
            message: "Admins can only remove members"
        });
    }

    if (target.role === "owner" && countOwners(req.team) === 1) {
        return res.status(400).json({
            success: false,
            message: "A team must keep at least one owner"
        });
    }

    req.team.members = req.team.members.filter((member) => member._id.toString() !== target._id.toString());
    await req.team.save();

    res.json({
        success: true,
        message: "Member removed from team"
    });
};

const addHackathon = async (req, res) => {
    const { hackathon } = req.body;

    if (!isValidId(hackathon)) {
        return res.status(400).json({
            success: false,
            message: "A valid hackathon ID is required"
        });
    }

    const exists = await Hackathon.exists({ _id: hackathon });
    if (!exists) {
        return res.status(404).json({
            success: false,
            message: "Hackathon not found"
        });
    }

    await Hackathon.updateOne({ _id: hackathon }, { $addToSet: { teams: req.team._id } });

    res.json({
        success: true,
        message: "Team added to hackathon"
    });
};

const removeHackathon = async (req, res) => {
    if (!isValidId(req.params.hackathonId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid hackathon ID"
        });
    }

    await Hackathon.updateOne({ _id: req.params.hackathonId }, { $pull: { teams: req.team._id } });

    res.json({
        success: true,
        message: "Team removed from hackathon"
    });
};

module.exports = {
    getMyTeams,
    createTeam,
    getTeamById,
    deleteTeam,
    inviteMember,
    getMyInvites,
    acceptInvite,
    declineInvite,
    leaveTeam,
    updateMemberRole,
    removeMember,
    addHackathon,
    removeHackathon
};
