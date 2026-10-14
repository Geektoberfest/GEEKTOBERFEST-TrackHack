const request = require("supertest");
const app = require("../src/app");
const { createUser, authHeaderFor } = require("./helpers");

describe("hackathon text length limits", () => {
    let auth;

    beforeEach(async () => {
        auth = authHeaderFor(await createUser());
    });

    test("rejects a title longer than 100 characters on create", async () => {
        const res = await request(app)
            .post("/api/hackathons")
            .set("Authorization", auth)
            .send({ title: "x".repeat(101), organizer: "Org" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be 100 characters or fewer");
    });

    test("accepts a title of exactly 100 characters", async () => {
        const res = await request(app)
            .post("/api/hackathons")
            .set("Authorization", auth)
            .send({ title: "x".repeat(100), organizer: "Org" });

        expect(res.status).toBe(201);
    });

    test("rejects a description longer than 2000 characters on update", async () => {
        const created = await request(app)
            .post("/api/hackathons")
            .set("Authorization", auth)
            .send({ title: "Hack", organizer: "Org" });

        const res = await request(app)
            .put("/api/hackathons/" + created.body.hackathon._id)
            .set("Authorization", auth)
            .send({ description: "x".repeat(2001) });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("description must be 2000 characters or fewer");
    });
});
