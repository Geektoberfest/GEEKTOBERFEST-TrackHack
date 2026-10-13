const request = require("supertest");
const app = require("../src/app");
const Tracker = require("../src/models/Tracker");
const Hackathon = require("../src/models/Hackathon");
const { createUser, authHeaderFor } = require("./helpers");

const createAdmin = (overrides = {}) => createUser({ ...overrides, role: "admin" });

describe("admin routes", () => {
    test("requires authentication", async () => {
        const res = await request(app).get("/api/admin/users");

        expect(res.status).toBe(401);
    });

    test("forbids non-admin users on all admin endpoints", async () => {
        const user = await createUser();
        const auth = authHeaderFor(user);

        const listed = await request(app).get("/api/admin/users").set("Authorization", auth);
        expect(listed.status).toBe(403);

        const patched = await request(app)
            .patch("/api/admin/users/000000000000000000000000/role")
            .set("Authorization", auth)
            .send({ role: "admin" });
        expect(patched.status).toBe(403);

        const deleted = await request(app)
            .delete("/api/admin/users/000000000000000000000000")
            .set("Authorization", auth);
        expect(deleted.status).toBe(403);
    });

    test("admin lists users without password hashes", async () => {
        const admin = await createAdmin({ email: "admin-list@example.com" });
        await createUser({ email: "listed@example.com" });

        const res = await request(app)
            .get("/api/admin/users")
            .set("Authorization", authHeaderFor(admin));

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(2);
        expect(res.body.users.find((u) => u.email === "listed@example.com")).toBeDefined();
        for (const u of res.body.users) {
            expect(u.password).toBeUndefined();
        }
    });

    test("admin promotes a user and the old token gains admin rights", async () => {
        const admin = await createAdmin();
        const user = await createUser({ email: "promote@example.com" });
        const staleAuth = authHeaderFor(user);

        const res = await request(app)
            .patch("/api/admin/users/" + user._id + "/role")
            .set("Authorization", authHeaderFor(admin))
            .send({ role: "admin" });

        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe("admin");

        // Role is resolved from the database, so the pre-promotion token works
        const withStaleToken = await request(app)
            .get("/api/admin/users")
            .set("Authorization", staleAuth);
        expect(withStaleToken.status).toBe(200);
    });

    test("role update validates input", async () => {
        const admin = await createAdmin();
        const auth = authHeaderFor(admin);
        const user = await createUser();

        const badId = await request(app)
            .patch("/api/admin/users/bad-id/role")
            .set("Authorization", auth)
            .send({ role: "admin" });
        expect(badId.status).toBe(400);

        const badRole = await request(app)
            .patch("/api/admin/users/" + user._id + "/role")
            .set("Authorization", auth)
            .send({ role: "superadmin" });
        expect(badRole.status).toBe(400);

        const missing = await request(app)
            .patch("/api/admin/users/000000000000000000000000/role")
            .set("Authorization", auth)
            .send({ role: "admin" });
        expect(missing.status).toBe(404);
    });

    test("admin cannot change their own role", async () => {
        const admin = await createAdmin();
        const res = await request(app)
            .patch("/api/admin/users/" + admin._id + "/role")
            .set("Authorization", authHeaderFor(admin))
            .send({ role: "user" });

        expect(res.status).toBe(403);
    });

    test("admin deletes a user and cascades trackers but keeps hackathons", async () => {
        const admin = await createAdmin({ email: "admin-del@example.com" });
        const victim = await createUser({ email: "victim@example.com" });
        const adminAuth = authHeaderFor(admin);
        const victimAuth = authHeaderFor(victim);

        const hack = await request(app)
            .post("/api/hackathons")
            .set("Authorization", victimAuth)
            .send({ title: "Victim Hack", organizer: "Org" });
        expect(hack.status).toBe(201);

        const tracker = await request(app)
            .post("/api/trackers")
            .set("Authorization", victimAuth)
            .send({ hackathon: hack.body.hackathon._id });
        expect(tracker.status).toBe(201);

        const res = await request(app)
            .delete("/api/admin/users/" + victim._id)
            .set("Authorization", adminAuth);
        expect(res.status).toBe(200);

        expect(await Tracker.findById(tracker.body.tracker._id)).toBeNull();
        expect(await Hackathon.findById(hack.body.hackathon._id)).not.toBeNull();
    });

    test("admin cannot delete their own account", async () => {
        const admin = await createAdmin();
        const res = await request(app)
            .delete("/api/admin/users/" + admin._id)
            .set("Authorization", authHeaderFor(admin));

        expect(res.status).toBe(403);
    });

    test("register ignores client-sent role", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Sneaky",
            email: "sneaky@example.com",
            password: "password123",
            role: "admin"
        });

        expect(res.status).toBe(201);
        expect(res.body.user.role).toBe("user");
    });

    test("ADMIN_EMAILS bootstraps an admin on register", async () => {
        process.env.ADMIN_EMAILS = "boss@example.com";
        try {
            const res = await request(app).post("/api/auth/register").send({
                name: "Boss",
                email: "boss@example.com",
                password: "password123"
            });

            expect(res.status).toBe(201);
            expect(res.body.user.role).toBe("admin");
        } finally {
            delete process.env.ADMIN_EMAILS;
        }
    });
});

describe("admin overrides on resources", () => {
    test("admin updates and deletes another user's hackathon", async () => {
        const owner = await createUser({ email: "hack-owner@example.com" });
        const admin = await createAdmin({ email: "hack-admin@example.com" });

        const created = await request(app)
            .post("/api/hackathons")
            .set("Authorization", authHeaderFor(owner))
            .send({ title: "Owner Hack", organizer: "Org" });
        const id = created.body.hackathon._id;

        const updated = await request(app)
            .put("/api/hackathons/" + id)
            .set("Authorization", authHeaderFor(admin))
            .send({ title: "Admin Edited" });
        expect(updated.status).toBe(200);
        expect(updated.body.hackathon.title).toBe("Admin Edited");

        const deleted = await request(app)
            .delete("/api/hackathons/" + id)
            .set("Authorization", authHeaderFor(admin));
        expect(deleted.status).toBe(200);
    });

    test("admin reads and edits another user's tracker; ?all=true is admin-only", async () => {
        const owner = await createUser({ email: "tracker-owner@example.com" });
        const other = await createUser({ email: "tracker-other@example.com" });
        const admin = await createAdmin({ email: "tracker-admin@example.com" });

        const hack = await request(app)
            .post("/api/hackathons")
            .set("Authorization", authHeaderFor(owner))
            .send({ title: "T Hack", organizer: "Org" });

        const created = await request(app)
            .post("/api/trackers")
            .set("Authorization", authHeaderFor(owner))
            .send({ hackathon: hack.body.hackathon._id });
        const trackerId = created.body.tracker._id;

        const read = await request(app)
            .get("/api/trackers/" + trackerId)
            .set("Authorization", authHeaderFor(admin));
        expect(read.status).toBe(200);

        const edited = await request(app)
            .put("/api/trackers/" + trackerId)
            .set("Authorization", authHeaderFor(admin))
            .send({ notes: "admin note" });
        expect(edited.status).toBe(200);

        const allAsAdmin = await request(app)
            .get("/api/trackers?all=true")
            .set("Authorization", authHeaderFor(admin));
        expect(allAsAdmin.status).toBe(200);
        expect(allAsAdmin.body.count).toBe(1);

        const allAsUser = await request(app)
            .get("/api/trackers?all=true")
            .set("Authorization", authHeaderFor(other));
        expect(allAsUser.status).toBe(403);
    });
});
