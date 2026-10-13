const request = require("supertest");
const app = require("../src/app");
const { createUser, authHeaderFor } = require("./helpers");

const hackathonPayload = (overrides = {}) => ({
    title: "Geek Hack 2026",
    organizer: "Geektoberfest",
    mode: "Online",
    status: "Upcoming",
    ...overrides
});

describe("hackathon routes", () => {
    test("requires authentication for creation", async () => {
        const res = await request(app).post("/api/hackathons").send(hackathonPayload());

        expect(res.status).toBe(401);
    });

    test("validates title and organizer", async () => {
        const user = await createUser();

        const res = await request(app)
            .post("/api/hackathons")
            .set("Authorization", authHeaderFor(user))
            .send({ title: "" });

        expect(res.status).toBe(400);
    });

    test("rejects end date before start date", async () => {
        const user = await createUser();

        const res = await request(app)
            .post("/api/hackathons")
            .set("Authorization", authHeaderFor(user))
            .send(
                hackathonPayload({
                    startDate: "2026-10-10",
                    endDate: "2026-10-01"
                })
            );

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/end date/i);
    });

    test("full CRUD with ownership checks", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const stranger = await createUser({ email: "stranger@example.com" });
        const ownerAuth = authHeaderFor(owner);
        const strangerAuth = authHeaderFor(stranger);

        const created = await request(app)
            .post("/api/hackathons")
            .set("Authorization", ownerAuth)
            .send(hackathonPayload({ title: "CRUD Hack" }));

        expect(created.status).toBe(201);
        const id = created.body.hackathon._id;

        const invalidId = await request(app)
            .get("/api/hackathons/not-an-id")
            .set("Authorization", ownerAuth);
        expect(invalidId.status).toBe(400);

        const missing = await request(app)
            .get("/api/hackathons/000000000000000000000000")
            .set("Authorization", ownerAuth);
        expect(missing.status).toBe(404);

        const fetched = await request(app)
            .get("/api/hackathons/" + id)
            .set("Authorization", ownerAuth);
        expect(fetched.status).toBe(200);
        expect(fetched.body.hackathon.title).toBe("CRUD Hack");

        const forbiddenUpdate = await request(app)
            .put("/api/hackathons/" + id)
            .set("Authorization", strangerAuth)
            .send({ title: "Hijacked" });
        expect(forbiddenUpdate.status).toBe(403);

        const updated = await request(app)
            .put("/api/hackathons/" + id)
            .set("Authorization", ownerAuth)
            .send({ title: "CRUD Hack Updated" });
        expect(updated.status).toBe(200);
        expect(updated.body.hackathon.title).toBe("CRUD Hack Updated");

        const forbiddenDelete = await request(app)
            .delete("/api/hackathons/" + id)
            .set("Authorization", strangerAuth);
        expect(forbiddenDelete.status).toBe(403);

        const deleted = await request(app)
            .delete("/api/hackathons/" + id)
            .set("Authorization", ownerAuth);
        expect(deleted.status).toBe(200);

        const afterDelete = await request(app)
            .get("/api/hackathons/" + id)
            .set("Authorization", ownerAuth);
        expect(afterDelete.status).toBe(404);
    });

    test("lists with status, mode, and mine filters", async () => {
        const user = await createUser();
        const auth = authHeaderFor(user);

        await request(app)
            .post("/api/hackathons")
            .set("Authorization", auth)
            .send(hackathonPayload({ title: "Online Upcoming", mode: "Online", status: "Upcoming" }));
        await request(app)
            .post("/api/hackathons")
            .set("Authorization", auth)
            .send(hackathonPayload({ title: "Offline Done", mode: "Offline", status: "Completed" }));

        const all = await request(app).get("/api/hackathons").set("Authorization", auth);
        expect(all.status).toBe(200);
        expect(all.body.count).toBe(2);

        const byStatus = await request(app)
            .get("/api/hackathons?status=Completed")
            .set("Authorization", auth);
        expect(byStatus.body.count).toBe(1);
        expect(byStatus.body.hackathons[0].title).toBe("Offline Done");

        const mine = await request(app)
            .get("/api/hackathons?mine=true")
            .set("Authorization", auth);
        expect(mine.body.count).toBe(2);
    });
});
