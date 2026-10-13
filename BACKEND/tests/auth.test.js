const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../src/app");
const { createUser, authHeaderFor } = require("./helpers");

describe("auth routes", () => {
    describe("POST /api/auth/register", () => {
        test("registers a user and returns token", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "Ada Lovelace",
                email: "ada@example.com",
                password: "password123",
                githubUsername: "ada"
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toEqual(expect.any(String));
            expect(res.body.user.email).toBe("ada@example.com");
        });

        test("rejects missing fields", async () => {
            const res = await request(app).post("/api/auth/register").send({
                email: "missing@example.com"
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test("rejects short password", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "Short",
                email: "short@example.com",
                password: "123"
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/6 characters/i);
        });

        test("rejects duplicate email", async () => {
            await createUser({ email: "dup@example.com" });

            const res = await request(app).post("/api/auth/register").send({
                name: "Dup",
                email: "DUP@example.com",
                password: "password123"
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already registered/i);
        });
    });

    describe("POST /api/auth/login", () => {
        test("logs in with valid credentials", async () => {
            await createUser({ email: "login@example.com", password: "password123" });

            const res = await request(app).post("/api/auth/login").send({
                email: "login@example.com",
                password: "password123"
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toEqual(expect.any(String));
        });

        test("rejects missing credentials", async () => {
            const res = await request(app).post("/api/auth/login").send({ email: "a@b.com" });

            expect(res.status).toBe(400);
        });

        test("rejects unknown email", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "unknown@example.com",
                password: "password123"
            });

            expect(res.status).toBe(401);
        });

        test("rejects wrong password", async () => {
            await createUser({ email: "wrong@example.com", password: "password123" });

            const res = await request(app).post("/api/auth/login").send({
                email: "wrong@example.com",
                password: "not-the-password"
            });

            expect(res.status).toBe(401);
        });
    });

    describe("GET /api/auth/me", () => {
        test("returns current user", async () => {
            const user = await createUser({ email: "me@example.com" });

            const res = await request(app)
                .get("/api/auth/me")
                .set("Authorization", authHeaderFor(user));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe("me@example.com");
        });

        test("requires auth", async () => {
            const res = await request(app).get("/api/auth/me");

            expect(res.status).toBe(401);
        });

        test("returns 404 for deleted user", async () => {
            const token = jwt.sign(
                { id: new mongoose.Types.ObjectId().toString() },
                process.env.JWT_SECRET || "test-jwt-secret"
            );

            const res = await request(app)
                .get("/api/auth/me")
                .set("Authorization", "Bearer " + token);

            expect(res.status).toBe(404);
        });
    });
});
