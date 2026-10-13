const request = require("supertest");
const app = require("../src/app");
const { createUser, authHeaderFor } = require("./helpers");

const create = (user, overrides) =>
    request(app)
        .post("/api/hackathons")
        .set("Authorization", authHeaderFor(user))
        .send({ organizer: "Org", mode: "Online", status: "Upcoming", ...overrides });

const titles = (res) => res.body.hackathons.map((hackathon) => hackathon.title);

describe("hackathon sorting", () => {
    let user;

    beforeEach(async () => {
        user = await createUser();
        await create(user, { title: "Bravo", startDate: "2026-11-01", registrationDeadline: "2026-10-20" });
        await create(user, { title: "Alpha", startDate: "2026-10-01", registrationDeadline: "2026-10-05" });
        await create(user, { title: "Charlie", startDate: "2026-12-01", registrationDeadline: "2026-10-25" });
        await create(user, { title: "No dates" });
    });

    const list = (query) =>
        request(app).get("/api/hackathons" + query).set("Authorization", authHeaderFor(user));

    test("start date soonest puts hackathons without a date last", async () => {
        const res = await list("?sort=startDate");

        expect(res.status).toBe(200);
        expect(titles(res)).toEqual(["Alpha", "Bravo", "Charlie", "No dates"]);
    });

    test("start date latest still puts hackathons without a date last", async () => {
        const res = await list("?sort=-startDate");

        expect(titles(res)).toEqual(["Charlie", "Bravo", "Alpha", "No dates"]);
    });

    test("deadline soonest and latest both put undated last", async () => {
        expect(titles(await list("?sort=deadline"))).toEqual(["Alpha", "Bravo", "Charlie", "No dates"]);
        expect(titles(await list("?sort=-deadline"))).toEqual(["Charlie", "Bravo", "Alpha", "No dates"]);
    });

    test("title A-Z and Z-A", async () => {
        expect(titles(await list("?sort=title"))).toEqual(["Alpha", "Bravo", "Charlie", "No dates"]);
        expect(titles(await list("?sort=-title"))).toEqual(["No dates", "Charlie", "Bravo", "Alpha"]);
    });

    test("pagination keeps the sort order across pages", async () => {
        const first = await list("?sort=startDate&page=1&limit=2");
        const second = await list("?sort=startDate&page=2&limit=2");

        expect(titles(first)).toEqual(["Alpha", "Bravo"]);
        expect(titles(second)).toEqual(["Charlie", "No dates"]);
        expect(second.body.total).toBe(4);
    });

    test("mine=true works with sorting and returns the creator name", async () => {
        const res = await list("?mine=true&sort=startDate");

        expect(res.status).toBe(200);
        expect(res.body.hackathons).toHaveLength(4);
        expect(res.body.hackathons[0].createdBy).toMatchObject({ name: expect.any(String) });
    });

    test("invalid sort value returns 400 and lists the allowed values", async () => {
        const res = await list("?sort=price");

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("-deadline");
        expect(res.body.message).toContain("-title");
    });
});
