const request = require("supertest");
const app = require("../src/app");
const { createUser, authHeaderFor } = require("./helpers");

describe("health and auth guard", () => {
    test("GET / returns API status", async () => {
        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/running/i);
    });

    test("protected route without token returns 401", async () => {
        const res = await request(app).get("/api/hackathons");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test("protected route with malformed header returns 401", async () => {
        const res = await request(app)
            .get("/api/hackathons")
            .set("Authorization", "Token abc");

        expect(res.status).toBe(401);
    });

    test("protected route with invalid token returns 401", async () => {
        const res = await request(app)
            .get("/api/hackathons")
            .set("Authorization", "Bearer invalid.token.here");

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/invalid|expired/i);
    });

    test("authenticated request reaches handler", async () => {
        const user = await createUser();

        const res = await request(app)
            .get("/api/hackathons")
            .set("Authorization", authHeaderFor(user));

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
