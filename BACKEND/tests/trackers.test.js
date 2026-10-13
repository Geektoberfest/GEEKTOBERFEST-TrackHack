const request = require("supertest");
const app = require("../src/app");
const { createUser, authHeaderFor } = require("./helpers");

const createHackathonFor = async (auth) => {
    const res = await request(app)
        .post("/api/hackathons")
        .set("Authorization", auth)
        .send({ title: "Tracker Hack", organizer: "TrackHack" });

    expect(res.status).toBe(201);
    return res.body.hackathon._id;
};

describe("tracker routes", () => {
    test("requires authentication", async () => {
        const res = await request(app).get("/api/trackers");

        expect(res.status).toBe(401);
    });

    test("validates hackathon id on create", async () => {
        const user = await createUser();
        const auth = authHeaderFor(user);

        const invalid = await request(app)
            .post("/api/trackers")
            .set("Authorization", auth)
            .send({ hackathon: "bad-id" });
        expect(invalid.status).toBe(400);

        const missing = await request(app)
            .post("/api/trackers")
            .set("Authorization", auth)
            .send({ hackathon: "000000000000000000000000" });
        expect(missing.status).toBe(404);
    });

    test("full tracker lifecycle with ownership", async () => {
        const owner = await createUser({ email: "tracker-owner@example.com" });
        const stranger = await createUser({ email: "tracker-stranger@example.com" });
        const ownerAuth = authHeaderFor(owner);
        const strangerAuth = authHeaderFor(stranger);

        const hackathonId = await createHackathonFor(ownerAuth);

        const created = await request(app)
            .post("/api/trackers")
            .set("Authorization", ownerAuth)
            .send({ hackathon: hackathonId, teamFormed: true });

        expect(created.status).toBe(201);
        expect(created.body.tracker.teamFormed).toBe(true);
        const trackerId = created.body.tracker._id;

        const duplicate = await request(app)
            .post("/api/trackers")
            .set("Authorization", ownerAuth)
            .send({ hackathon: hackathonId });
        expect(duplicate.status).toBe(400);

        const listed = await request(app).get("/api/trackers").set("Authorization", ownerAuth);
        expect(listed.status).toBe(200);
        expect(listed.body.count).toBe(1);

        const filtered = await request(app)
            .get("/api/trackers?hackathon=" + hackathonId)
            .set("Authorization", ownerAuth);
        expect(filtered.body.count).toBe(1);

        const badFilter = await request(app)
            .get("/api/trackers?hackathon=bad-id")
            .set("Authorization", ownerAuth);
        expect(badFilter.status).toBe(400);

        const forbiddenRead = await request(app)
            .get("/api/trackers/" + trackerId)
            .set("Authorization", strangerAuth);
        expect(forbiddenRead.status).toBe(403);

        const read = await request(app)
            .get("/api/trackers/" + trackerId)
            .set("Authorization", ownerAuth);
        expect(read.status).toBe(200);

        const forbiddenUpdate = await request(app)
            .put("/api/trackers/" + trackerId)
            .set("Authorization", strangerAuth)
            .send({ ideaSubmitted: true });
        expect(forbiddenUpdate.status).toBe(403);

        const updated = await request(app)
            .put("/api/trackers/" + trackerId)
            .set("Authorization", ownerAuth)
            .send({ ideaSubmitted: true, notes: "Started" });
        expect(updated.status).toBe(200);
        expect(updated.body.tracker.ideaSubmitted).toBe(true);

        const forbiddenDelete = await request(app)
            .delete("/api/trackers/" + trackerId)
            .set("Authorization", strangerAuth);
        expect(forbiddenDelete.status).toBe(403);

        const deleted = await request(app)
            .delete("/api/trackers/" + trackerId)
            .set("Authorization", ownerAuth);
        expect(deleted.status).toBe(200);

        const afterDelete = await request(app)
            .get("/api/trackers/" + trackerId)
            .set("Authorization", ownerAuth);
        expect(afterDelete.status).toBe(404);
    });
});
