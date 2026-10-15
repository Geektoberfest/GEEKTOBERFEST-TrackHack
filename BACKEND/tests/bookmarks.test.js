const request = require("supertest");
const app = require("../src/app");
const { createUser, authHeaderFor } = require("./helpers");

const createHackathon = async (auth, title = "Saved Hack") => {
    const res = await request(app)
        .post("/api/hackathons")
        .set("Authorization", auth)
        .send({ title, organizer: "TrackHack" });

    expect(res.status).toBe(201);
    return res.body.hackathon._id;
};

describe("bookmark routes", () => {
    test("requires authentication", async () => {
        const res = await request(app).get("/api/bookmarks");

        expect(res.status).toBe(401);
    });

    test("saves, lists and removes a hackathon", async () => {
        const user = await createUser();
        const auth = authHeaderFor(user);
        const hackathonId = await createHackathon(auth);

        const saved = await request(app).post("/api/bookmarks").set("Authorization", auth).send({ hackathon: hackathonId });
        expect(saved.status).toBe(201);

        const list = await request(app).get("/api/bookmarks").set("Authorization", auth);
        expect(list.status).toBe(200);
        expect(list.body.count).toBe(1);
        expect(list.body.hackathons[0]).toMatchObject({ title: "Saved Hack" });

        const removed = await request(app).delete("/api/bookmarks/" + hackathonId).set("Authorization", auth);
        expect(removed.status).toBe(200);

        const after = await request(app).get("/api/bookmarks").set("Authorization", auth);
        expect(after.body.count).toBe(0);
    });

    test("the same hackathon cannot be saved twice", async () => {
        const user = await createUser();
        const auth = authHeaderFor(user);
        const hackathonId = await createHackathon(auth);

        await request(app).post("/api/bookmarks").set("Authorization", auth).send({ hackathon: hackathonId });
        const again = await request(app).post("/api/bookmarks").set("Authorization", auth).send({ hackathon: hackathonId });

        expect(again.status).toBe(400);
    });

    test("validates the hackathon id and existence", async () => {
        const user = await createUser();
        const auth = authHeaderFor(user);

        const invalid = await request(app).post("/api/bookmarks").set("Authorization", auth).send({ hackathon: "nope" });
        expect(invalid.status).toBe(400);

        const missing = await request(app)
            .post("/api/bookmarks")
            .set("Authorization", auth)
            .send({ hackathon: "65f000000000000000000000" });
        expect(missing.status).toBe(404);
    });

    test("users only see and remove their own bookmarks", async () => {
        const owner = await createUser();
        const other = await createUser();
        const hackathonId = await createHackathon(authHeaderFor(owner));

        await request(app).post("/api/bookmarks").set("Authorization", authHeaderFor(owner)).send({ hackathon: hackathonId });

        const otherList = await request(app).get("/api/bookmarks").set("Authorization", authHeaderFor(other));
        expect(otherList.body.count).toBe(0);

        const otherRemove = await request(app)
            .delete("/api/bookmarks/" + hackathonId)
            .set("Authorization", authHeaderFor(other));
        expect(otherRemove.status).toBe(404);

        const ownerList = await request(app).get("/api/bookmarks").set("Authorization", authHeaderFor(owner));
        expect(ownerList.body.count).toBe(1);
    });

    test("deleting a hackathon removes its bookmarks", async () => {
        const user = await createUser();
        const auth = authHeaderFor(user);
        const hackathonId = await createHackathon(auth);
        await request(app).post("/api/bookmarks").set("Authorization", auth).send({ hackathon: hackathonId });

        await request(app).delete("/api/hackathons/" + hackathonId).set("Authorization", auth);

        const list = await request(app).get("/api/bookmarks").set("Authorization", auth);
        expect(list.body.count).toBe(0);
    });
});
