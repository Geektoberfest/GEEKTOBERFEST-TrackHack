const Team = require("../models/Team");
const TeamInvite = require("../models/TeamInvite");
const Hackathon = require("../models/Hackathon");

// Removes a team and everything pointing at it.
const deleteTeamCascade = async (teamId) => {
    await TeamInvite.deleteMany({ team: teamId });
    await Hackathon.updateMany({ teams: teamId }, { $pull: { teams: teamId } });
    await Team.deleteOne({ _id: teamId });
};

// Takes a user out of every team they belong to, drops their invites, and keeps
// each team owned. Teams left with no members are deleted.
const removeUserFromTeams = async (userId) => {
    await TeamInvite.deleteMany({ $or: [{ invitedUser: userId }, { invitedBy: userId }] });

    const teams = await Team.find({ "members.user": userId });

    for (const team of teams) {
        team.members = team.members.filter((member) => member.user.toString() !== userId.toString());

        if (team.members.length === 0) {
            await deleteTeamCascade(team._id);
            continue;
        }

        if (!team.members.some((member) => member.role === "owner")) {
            // hand ownership to an admin if there is one, otherwise the longest-standing member
            const successor = team.members.find((member) => member.role === "admin") || team.members[0];
            successor.role = "owner";
        }

        await team.save();
    }
};

module.exports = { deleteTeamCascade, removeUserFromTeams };
