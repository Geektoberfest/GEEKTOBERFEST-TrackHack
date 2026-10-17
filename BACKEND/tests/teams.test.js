const request = require("supertest");
const app = require("../src/app");
const Team = require("../src/models/Team");
const TeamInvite = require("../src/models/TeamInvite");
const Hackathon = require("../src/models/Hackathon");
const { createUser, authHeaderFor } = require("./helpers");

const createTeam = async (auth, name = "Team Alpha") => {
    const res = await request(app).post("/api/teams").set("Authorization", auth).send({ name });
    expect(res.status).toBe(201);
    return res.body.team._id;
};

// invites the user by email and accepts it, so they end up as a member
const addMember = async (teamId, ownerAuth, user, role = "member") => {
    const invited = await request(app)
        .post("/api/teams/" + teamId + "/invites")
        .set("Authorization", ownerAuth)
        .send({ email: user.email });
    expect(invited.status).toBe(201);

    const invite = await TeamInvite.findOne({ team: teamId, invitedUser: user._id, status: "pending" });
    const accepted = await request(app).post("/api/teams/invites/" + invite._id + "/accept").set("Authorization", authHeaderFor(user));
    expect(accepted.status).toBe(200);

    if (role !== "member") {
        const promoted = await request(app)
            .patch("/api/teams/" + teamId + "/members/" + user._id + "/role")
            .set("Authorization", ownerAuth)
            .send({ role });
        expect(promoted.status).toBe(200);
    }
};

describe("team routes", () => {
    test("requires authentication", async () => {
        const res = await request(app).get("/api/teams");

        expect(res.status).toBe(401);
    });

    test("creating a team makes the creator its owner", async () => {
        const user = await createUser();
        const auth = authHeaderFor(user);
        const teamId = await createTeam(auth);

        const list = await request(app).get("/api/teams").set("Authorization", auth);
        expect(list.body.count).toBe(1);
        expect(list.body.teams[0]).toMatchObject({ _id: teamId, name: "Team Alpha", memberCount: 1, myRole: "owner" });
    });

    test("team name is required and limited in length", async () => {
        const auth = authHeaderFor(await createUser());

        const empty = await request(app).post("/api/teams").set("Authorization", auth).send({ name: "   " });
        expect(empty.status).toBe(400);

        const tooLong = await request(app).post("/api/teams").set("Authorization", auth).send({ name: "x".repeat(61) });
        expect(tooLong.status).toBe(400);
    });

    test("non-members cannot see a team", async () => {
        const owner = await createUser();
        const outsider = await createUser();
        const teamId = await createTeam(authHeaderFor(owner));

        const res = await request(app).get("/api/teams/" + teamId).set("Authorization", authHeaderFor(outsider));

        expect(res.status).toBe(403);
    });

    test("invalid team ids are rejected", async () => {
        const auth = authHeaderFor(await createUser());

        const res = await request(app).get("/api/teams/not-an-id").set("Authorization", auth);

        expect(res.status).toBe(400);
    });

    test("plain members cannot invite, admins can", async () => {
        const owner = await createUser();
        const member = await createUser();
        const admin = await createUser();
        const newcomer = await createUser();
        const ownerAuth = authHeaderFor(owner);
        const teamId = await createTeam(ownerAuth);
        await addMember(teamId, ownerAuth, member);
        await addMember(teamId, ownerAuth, admin, "admin");

        const byMember = await request(app)
            .post("/api/teams/" + teamId + "/invites")
            .set("Authorization", authHeaderFor(member))
            .send({ email: newcomer.email });
        expect(byMember.status).toBe(403);

        const byAdmin = await request(app)
            .post("/api/teams/" + teamId + "/invites")
            .set("Authorization", authHeaderFor(admin))
            .send({ email: newcomer.email });
        expect(byAdmin.status).toBe(201);
    });

    test("inviting validates the email, existing members and duplicate invites", async () => {
        const owner = await createUser();
        const member = await createUser();
        const ownerAuth = authHeaderFor(owner);
        const teamId = await createTeam(ownerAuth);
        await addMember(teamId, ownerAuth, member);

        const unknown = await request(app)
            .post("/api/teams/" + teamId + "/invites")
            .set("Authorization", ownerAuth)
            .send({ email: "nobody@example.com" });
        expect(unknown.status).toBe(404);

        const alreadyMember = await request(app)
            .post("/api/teams/" + teamId + "/invites")
            .set("Authorization", ownerAuth)
            .send({ email: member.email });
        expect(alreadyMember.status).toBe(400);

        const invitee = await createUser();
        await request(app).post("/api/teams/" + teamId + "/invites").set("Authorization", ownerAuth).send({ email: invitee.email });
        const duplicate = await request(app)
            .post("/api/teams/" + teamId + "/invites")
            .set("Authorization", ownerAuth)
            .send({ email: invitee.email.toUpperCase() });
        expect(duplicate.status).toBe(400);
    });

    test("invitee sees pending invites and can accept", async () => {
        const owner = await createUser();
        const invitee = await createUser();
        const teamId = await createTeam(authHeaderFor(owner));
        await request(app).post("/api/teams/" + teamId + "/invites").set("Authorization", authHeaderFor(owner)).send({ email: invitee.email });

        const inviteeAuth = authHeaderFor(invitee);
        const pending = await request(app).get("/api/teams/invites").set("Authorization", inviteeAuth);
        expect(pending.body.count).toBe(1);
        expect(pending.body.invites[0].team.name).toBe("Team Alpha");

        const invite = pending.body.invites[0];
        const accepted = await request(app).post("/api/teams/invites/" + invite._id + "/accept").set("Authorization", inviteeAuth);
        expect(accepted.status).toBe(200);

        const list = await request(app).get("/api/teams").set("Authorization", inviteeAuth);
        expect(list.body.teams[0]).toMatchObject({ myRole: "member", memberCount: 2 });

        const again = await request(app).get("/api/teams/invites").set("Authorization", inviteeAuth);
        expect(again.body.count).toBe(0);
    });

    test("declined invites do not add the user to the team", async () => {
        const owner = await createUser();
        const invitee = await createUser();
        const teamId = await createTeam(authHeaderFor(owner));
        await request(app).post("/api/teams/" + teamId + "/invites").set("Authorization", authHeaderFor(owner)).send({ email: invitee.email });
        const invite = await TeamInvite.findOne({ team: teamId });

        const declined = await request(app)
            .post("/api/teams/invites/" + invite._id + "/decline")
            .set("Authorization", authHeaderFor(invitee));
        expect(declined.status).toBe(200);

        const team = await Team.findById(teamId);
        expect(team.members.length).toBe(1);
        expect(await TeamInvite.findById(invite._id)).toMatchObject({ status: "declined" });
    });

    test("only the invitee can answer an invite", async () => {
        const owner = await createUser();
        const invitee = await createUser();
        const stranger = await createUser();
        const teamId = await createTeam(authHeaderFor(owner));
        await request(app).post("/api/teams/" + teamId + "/invites").set("Authorization", authHeaderFor(owner)).send({ email: invitee.email });
        const invite = await TeamInvite.findOne({ team: teamId });

        const res = await request(app)
            .post("/api/teams/invites/" + invite._id + "/accept")
            .set("Authorization", authHeaderFor(stranger));

        expect(res.status).toBe(404);
    });

    test("owners can change roles but cannot demote the last owner", async () => {
        const owner = await createUser();
        const member = await createUser();
        const ownerAuth = authHeaderFor(owner);
        const teamId = await createTeam(ownerAuth);
        await addMember(teamId, ownerAuth, member);

        const lastOwner = await request(app)
            .patch("/api/teams/" + teamId + "/members/" + owner._id + "/role")
            .set("Authorization", ownerAuth)
            .send({ role: "member" });
        expect(lastOwner.status).toBe(400);

        const promoted = await request(app)
            .patch("/api/teams/" + teamId + "/members/" + member._id + "/role")
            .set("Authorization", ownerAuth)
            .send({ role: "owner" });
        expect(promoted.status).toBe(200);

        const demoted = await request(app)
            .patch("/api/teams/" + teamId + "/members/" + owner._id + "/role")
            .set("Authorization", ownerAuth)
            .send({ role: "member" });
        expect(demoted.status).toBe(200);
    });

    test("admins cannot change roles", async () => {
        const owner = await createUser();
        const admin = await createUser();
        const member = await createUser();
        const ownerAuth = authHeaderFor(owner);
        const teamId = await createTeam(ownerAuth);
        await addMember(teamId, ownerAuth, admin, "admin");
        await addMember(teamId, ownerAuth, member);

        const res = await request(app)
            .patch("/api/teams/" + teamId + "/members/" + member._id + "/role")
            .set("Authorization", authHeaderFor(admin))
            .send({ role: "admin" });

        expect(res.status).toBe(403);
    });

    test("admins can remove members but not other admins or owners", async () => {
        const owner = await createUser();
        const admin = await createUser();
        const otherAdmin = await createUser();
        const member = await createUser();
        const ownerAuth = authHeaderFor(owner);
        const teamId = await createTeam(ownerAuth);
        await addMember(teamId, ownerAuth, admin, "admin");
        await addMember(teamId, ownerAuth, otherAdmin, "admin");
        await addMember(teamId, ownerAuth, member);
        const adminAuth = authHeaderFor(admin);

        const removeAdmin = await request(app)
            .delete("/api/teams/" + teamId + "/members/" + otherAdmin._id)
            .set("Authorization", adminAuth);
        expect(removeAdmin.status).toBe(403);

        const removeOwner = await request(app)
            .delete("/api/teams/" + teamId + "/members/" + owner._id)
            .set("Authorization", adminAuth);
        expect(removeOwner.status).toBe(403);

        const removeMember = await request(app)
            .delete("/api/teams/" + teamId + "/members/" + member._id)
            .set("Authorization", adminAuth);
        expect(removeMember.status).toBe(200);
    });

    test("a member can leave, but the last owner cannot", async () => {
        const owner = await createUser();
        const member = await createUser();
        const ownerAuth = authHeaderFor(owner);
        const teamId = await createTeam(ownerAuth);
        await addMember(teamId, ownerAuth, member);

        const ownerLeaves = await request(app).post("/api/teams/" + teamId + "/leave").set("Authorization", ownerAuth);
        expect(ownerLeaves.status).toBe(400);

        const memberLeaves = await request(app)
            .post("/api/teams/" + teamId + "/leave")
            .set("Authorization", authHeaderFor(member));
        expect(memberLeaves.status).toBe(200);

        const team = await Team.findById(teamId);
        expect(team.members.map((m) => m.user.toString())).toEqual([owner._id.toString()]);
    });

    test("owner can add a team to a hackathon and the hackathon shows it", async () => {
        const owner = await createUser();
        const ownerAuth = authHeaderFor(owner);
        const hackathon = await Hackathon.create({ title: "Team Jam", organizer: "TrackHack", createdBy: owner._id });
        const teamId = await createTeam(ownerAuth);

        const added = await request(app)
            .post("/api/teams/" + teamId + "/hackathons")
            .set("Authorization", ownerAuth)
            .send({ hackathon: hackathon._id.toString() });
        expect(added.status).toBe(200);

        const details = await request(app).get("/api/hackathons/" + hackathon._id).set("Authorization", ownerAuth);
        expect(details.body.hackathon.teams).toEqual([expect.objectContaining({ name: "Team Alpha" })]);
    });

    test("associating a hackathon validates the id and existence", async () => {
        const ownerAuth = authHeaderFor(await createUser());
        const teamId = await createTeam(ownerAuth);

        const invalid = await request(app)
            .post("/api/teams/" + teamId + "/hackathons")
            .set("Authorization", ownerAuth)
            .send({ hackathon: "nope" });
        expect(invalid.status).toBe(400);

        const missing = await request(app)
            .post("/api/teams/" + teamId + "/hackathons")
            .set("Authorization", ownerAuth)
            .send({ hackathon: "65f000000000000000000000" });
        expect(missing.status).toBe(404);
    });

    test("deleting a team removes it from hackathons and clears its invites", async () => {
        const owner = await createUser();
        const ownerAuth = authHeaderFor(owner);
        const hackathon = await Hackathon.create({ title: "Team Jam", organizer: "TrackHack", createdBy: owner._id });
        const teamId = await createTeam(ownerAuth);
        await request(app).post("/api/teams/" + teamId + "/hackathons").set("Authorization", ownerAuth).send({ hackathon: hackathon._id.toString() });
        await request(app).post("/api/teams/" + teamId + "/invites").set("Authorization", ownerAuth).send({ email: (await createUser()).email });

        const res = await request(app).delete("/api/teams/" + teamId).set("Authorization", ownerAuth);
        expect(res.status).toBe(200);

        expect(await Team.findById(teamId)).toBeNull();
        expect(await TeamInvite.countDocuments({ team: teamId })).toBe(0);
        expect((await Hackathon.findById(hackathon._id)).teams).toEqual([]);
    });

    test("deleting a user keeps teams owned and drops their invites", async () => {
        const admin = await createUser({ role: "admin" });
        const owner = await createUser();
        const successor = await createUser();
        const ownerAuth = authHeaderFor(owner);
        const teamId = await createTeam(ownerAuth);
        await addMember(teamId, ownerAuth, successor);
        await request(app)
            .patch("/api/teams/" + teamId + "/members/" + successor._id + "/role")
            .set("Authorization", ownerAuth)
            .send({ role: "admin" });
        const pendingInvitee = await createUser();
        await request(app).post("/api/teams/" + teamId + "/invites").set("Authorization", ownerAuth).send({ email: pendingInvitee.email });

        const res = await request(app)
            .delete("/api/admin/users/" + owner._id)
            .set("Authorization", authHeaderFor(admin));
        expect(res.status).toBe(200);

        const team = await Team.findById(teamId);
        expect(team.members).toHaveLength(1);
        expect(team.members[0].user.toString()).toBe(successor._id.toString());
        expect(team.members[0].role).toBe("owner");
        expect(await TeamInvite.countDocuments({ team: teamId, invitedBy: owner._id })).toBe(0);
    });

    test("deleting a user who was alone in a team deletes that team", async () => {
        const admin = await createUser({ role: "admin" });
        const owner = await createUser();
        const teamId = await createTeam(authHeaderFor(owner));

        await request(app).delete("/api/admin/users/" + owner._id).set("Authorization", authHeaderFor(admin));

        expect(await Team.findById(teamId)).toBeNull();
    });
});
