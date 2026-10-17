const request = require("supertest");
const app = require("../src/app");
const Tracker = require("../src/models/Tracker");
const Hackathon = require("../src/models/Hackathon");
const { createUser, authHeaderFor } = require("./helpers");

const monthsAgo = (count) => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count, 15, 12));
};

const createHackathon = (owner, status, title = "Hack") =>
    Hackathon.create({ title, organizer: "TrackHack", status, createdBy: owner._id });

const track = (user, hackathon, extra = {}) =>
    Tracker.create({ user: user._id, hackathon: hackathon._id, ...extra });

const getAnalytics = (auth, query = "") =>
    request(app).get("/api/analytics/me" + query).set("Authorization", auth);

describe("analytics routes", () => {
    test("requires authentication", async () => {
        const res = await request(app).get("/api/analytics/me");

        expect(res.status).toBe(401);
    });

    test("an account with no trackers gets zeroed numbers and no success rate", async () => {
        const user = await createUser();

        const res = await getAnalytics(authHeaderFor(user));

        expect(res.status).toBe(200);
        expect(res.body.scope).toBe("me");
        expect(res.body.totals).toEqual({ tracked: 0, successful: 0, successRate: null });
        expect(res.body.statusCounts.every((item) => item.count === 0)).toBe(true);
        expect(res.body.monthly).toHaveLength(12);
        expect(res.body.monthly.every((item) => item.count === 0)).toBe(true);
    });

    test("counts tracked hackathons by their status", async () => {
        const user = await createUser();
        const owner = await createUser();
        const auth = authHeaderFor(user);
        await track(user, await createHackathon(owner, "Upcoming"));
        await track(user, await createHackathon(owner, "Upcoming"));
        await track(user, await createHackathon(owner, "In Progress"));
        await track(user, await createHackathon(owner, "Completed"));

        const res = await getAnalytics(auth);

        expect(res.body.totals.tracked).toBe(4);
        const byStatus = Object.fromEntries(res.body.statusCounts.map((item) => [item.status, item.count]));
        expect(byStatus).toEqual({
            Upcoming: 2,
            Registered: 0,
            "In Progress": 1,
            Completed: 1,
            Cancelled: 0
        });
    });

    test("buckets tracked hackathons into the month they were tracked", async () => {
        const user = await createUser();
        const owner = await createUser();
        const hackathon = await createHackathon(owner, "Upcoming");
        await track(user, hackathon, { createdAt: monthsAgo(0) });
        await track(user, await createHackathon(owner, "Upcoming"), { createdAt: monthsAgo(0) });
        await track(user, await createHackathon(owner, "Upcoming"), { createdAt: monthsAgo(2) });
        // older than the 12-month window, so it is not in the chart
        await track(user, await createHackathon(owner, "Upcoming"), { createdAt: monthsAgo(20) });

        const res = await getAnalytics(authHeaderFor(user));

        const thisMonth = res.body.monthly[res.body.monthly.length - 1];
        const twoMonthsAgo = res.body.monthly[res.body.monthly.length - 3];
        expect(thisMonth.count).toBe(2);
        expect(twoMonthsAgo.count).toBe(1);
        expect(res.body.monthly.reduce((sum, item) => sum + item.count, 0)).toBe(3);
        // the month list is oldest first and ends with the current month
        expect(res.body.monthly[res.body.monthly.length - 1].month).toBe(new Date().toISOString().slice(0, 7));
    });

    test("success rate counts Participated, Shortlisted and Winner over all tracked", async () => {
        const user = await createUser();
        const owner = await createUser();
        const auth = authHeaderFor(user);
        await track(user, await createHackathon(owner, "Completed"), { finalResult: "Winner" });
        await track(user, await createHackathon(owner, "Completed"), { finalResult: "Shortlisted" });
        await track(user, await createHackathon(owner, "Completed"), { finalResult: "Participated" });
        await track(user, await createHackathon(owner, "Completed"), { finalResult: "Pending" });

        const res = await getAnalytics(auth);

        expect(res.body.totals).toEqual({ tracked: 4, successful: 3, successRate: 75 });
    });

    test("only shows the logged-in user's own trackers", async () => {
        const user = await createUser();
        const other = await createUser();
        const owner = await createUser();
        await track(other, await createHackathon(owner, "Upcoming"));

        const res = await getAnalytics(authHeaderFor(user));

        expect(res.body.totals.tracked).toBe(0);
    });

    test("admins can ask for all users with ?all=true", async () => {
        const admin = await createUser({ role: "admin" });
        const user = await createUser();
        const owner = await createUser();
        await track(user, await createHackathon(owner, "Upcoming"));
        await track(admin, await createHackathon(owner, "Upcoming"));

        const res = await getAnalytics(authHeaderFor(admin), "?all=true");

        expect(res.status).toBe(200);
        expect(res.body.scope).toBe("all");
        expect(res.body.totals.tracked).toBe(2);
    });

    test("non-admins cannot ask for all users", async () => {
        const user = await createUser();

        const res = await getAnalytics(authHeaderFor(user), "?all=true");

        expect(res.status).toBe(403);
    });
});
