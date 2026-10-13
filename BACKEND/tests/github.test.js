const request = require("supertest");
const app = require("../src/app");
const { createUser, authHeaderFor } = require("./helpers");

const profileFixture = {
    login: "octocat",
    name: "Octo Cat",
    avatar_url: "https://example.com/avatar.png",
    bio: "GitHub mascot",
    public_repos: 8,
    followers: 100,
    following: 9,
    html_url: "https://github.com/octocat"
};

const reposFixture = [
    {
        name: "hello-world",
        description: "fixture repo",
        language: "JavaScript",
        stargazers_count: 42,
        html_url: "https://github.com/octocat/hello-world",
        updated_at: "2026-01-01T00:00:00Z"
    }
];

const mockFetchOnce = (payload, options = {}) => {
    const { status = 200, ok = true } = options;
    global.fetch = jest.fn().mockResolvedValue({
        status,
        ok,
        json: async () => payload
    });
};

describe("github routes", () => {
    test("requires authentication", async () => {
        const res = await request(app).get("/api/github/profile/octocat");

        expect(res.status).toBe(401);
    });

    test("returns mapped profile", async () => {
        const user = await createUser();
        mockFetchOnce(profileFixture);

        const res = await request(app)
            .get("/api/github/profile/octocat")
            .set("Authorization", authHeaderFor(user));

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.profile).toMatchObject({
            username: "octocat",
            name: "Octo Cat",
            publicRepos: 8
        });
    });

    test("returns mapped repos with count", async () => {
        const user = await createUser();
        mockFetchOnce(reposFixture);

        const res = await request(app)
            .get("/api/github/repos/octocat")
            .set("Authorization", authHeaderFor(user));

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(res.body.repos[0]).toMatchObject({
            name: "hello-world",
            stars: 42
        });
    });

    test("maps GitHub 404 to 404", async () => {
        const user = await createUser();
        mockFetchOnce({}, { status: 404, ok: false });

        const res = await request(app)
            .get("/api/github/profile/missing-user")
            .set("Authorization", authHeaderFor(user));

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test("maps rate limit to 429", async () => {
        const user = await createUser();
        mockFetchOnce({}, { status: 403, ok: false });

        const res = await request(app)
            .get("/api/github/repos/octocat")
            .set("Authorization", authHeaderFor(user));

        expect(res.status).toBe(429);
    });
});
