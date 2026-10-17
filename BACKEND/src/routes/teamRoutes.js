const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/teamController");
const { auth } = require("../middleware/auth.middleware");
const { requireTeamRole } = require("../middleware/team.middleware");

// /invites is declared before /:id so it is not read as a team ID
router.get("/invites", auth, getMyInvites);
router.post("/invites/:inviteId/accept", auth, acceptInvite);
router.post("/invites/:inviteId/decline", auth, declineInvite);

router.get("/", auth, getMyTeams);
router.post("/", auth, createTeam);
router.get("/:id", auth, requireTeamRole(), getTeamById);
router.delete("/:id", auth, requireTeamRole("owner"), deleteTeam);
router.post("/:id/invites", auth, requireTeamRole("owner", "admin"), inviteMember);
router.post("/:id/leave", auth, requireTeamRole(), leaveTeam);
router.patch("/:id/members/:userId/role", auth, requireTeamRole("owner"), updateMemberRole);
router.delete("/:id/members/:userId", auth, requireTeamRole("owner", "admin"), removeMember);
router.post("/:id/hackathons", auth, requireTeamRole("owner", "admin"), addHackathon);
router.delete("/:id/hackathons/:hackathonId", auth, requireTeamRole("owner", "admin"), removeHackathon);

module.exports = router;
