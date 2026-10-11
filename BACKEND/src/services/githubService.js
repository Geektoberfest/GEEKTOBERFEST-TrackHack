const baseUrl = "https://api.github.com";

const makeHeaders = () => {
    const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "HackTrack"
    };

    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN;
    }

    return headers;
};

// simple in-memory cache so we don't hit GitHub's rate limit (60 requests/hour without a token)
const CACHE_TIME = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const cache = new Map();

const makeError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const fetchFromGitHub = async (path) => {
    let response;
    try {
        response = await fetch(baseUrl + path, {
            headers: makeHeaders(),
            signal: AbortSignal.timeout(10000)
        });
    } catch {
        throw makeError("Could not reach GitHub. Please try again later", 503);
    }

    if (response.status === 404) {
        throw makeError("GitHub user not found", 404);
    }

    if (response.status === 403 || response.status === 429) {
        if (response.headers.get("x-ratelimit-remaining") === "0") {
            const reset = Number(response.headers.get("x-ratelimit-reset")) * 1000;
            const minutes = Math.max(1, Math.ceil((reset - Date.now()) / 60000));
            throw makeError("GitHub rate limit reached. Try again in " + minutes + " min or add a GITHUB_TOKEN to your .env file", 429);
        }
        throw makeError("GitHub refused the request", 502);
    }

    if (!response.ok) {
        throw makeError("GitHub request failed", 502);
    }

    return response.json();
};

const callGitHub = async (path) => {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.time < CACHE_TIME) {
        return cached.data;
    }

    const data = await fetchFromGitHub(path);

    // remove the oldest entry so the cache can't grow forever
    if (cache.size >= MAX_CACHE_ENTRIES) {
        cache.delete(cache.keys().next().value);
    }
    cache.set(path, { data, time: Date.now() });

    return data;
};

const getUserProfile = async (username) => {
    const data = await callGitHub("/users/" + encodeURIComponent(username));

    return {
        username: data.login,
        name: data.name,
        avatarUrl: data.avatar_url,
        bio: data.bio,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
        profileUrl: data.html_url
    };
};

const getUserRepos = async (username) => {
    const data = await callGitHub("/users/" + encodeURIComponent(username) + "/repos?sort=updated&per_page=10");

    return data.map((repo) => {
        return {
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            url: repo.html_url,
            updatedAt: repo.updated_at
        };
    });
};

const ACTIVITY_DAYS = 30;

const eventTypes = {
    PushEvent: "pushes",
    PullRequestEvent: "pullRequests",
    PullRequestReviewEvent: "reviews",
    IssuesEvent: "issues",
    IssueCommentEvent: "comments",
    CreateEvent: "created"
};

const getUserStats = async (username) => {
    const name = encodeURIComponent(username);

    // GitHub only returns public events from the last 90 days (max 100 per page)
    const [profile, repos, events] = await Promise.all([
        getUserProfile(username),
        callGitHub("/users/" + name + "/repos?type=owner&sort=updated&per_page=100"),
        callGitHub("/users/" + name + "/events/public?per_page=100")
    ]);

    const ownRepos = repos.filter((repo) => !repo.fork);

    const languageCounts = {};
    ownRepos.forEach((repo) => {
        if (repo.language) {
            languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
        }
    });
    const languages = Object.keys(languageCounts)
        .map((language) => ({ language, repos: languageCounts[language] }))
        .sort((a, b) => b.repos - a.repos)
        .slice(0, 6);

    const topRepos = [...ownRepos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 5)
        .map((repo) => ({
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            url: repo.html_url,
            updatedAt: repo.pushed_at
        }));

    // one entry per day for the last 30 days, oldest first
    const days = [];
    for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - i);
        days.push({ date: date.toISOString().slice(0, 10), count: 0 });
    }
    const firstDay = days[0].date;

    const activity = { pushes: 0, pullRequests: 0, reviews: 0, issues: 0, comments: 0, created: 0 };
    events.forEach((event) => {
        const day = event.created_at.slice(0, 10);
        if (day < firstDay) {
            return;
        }

        const entry = days.find((item) => item.date === day);
        if (entry) {
            entry.count++;
        }

        const key = eventTypes[event.type];
        // only count opened PRs/issues, not closed or edited ones
        if (key && (key === "pullRequests" || key === "issues" ? event.payload.action === "opened" : true)) {
            activity[key]++;
        }
    });

    return {
        profile,
        repoStats: {
            totalRepos: profile.publicRepos,
            ownRepos: ownRepos.length,
            totalStars: ownRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
            totalForks: ownRepos.reduce((sum, repo) => sum + repo.forks_count, 0)
        },
        languages,
        topRepos,
        activity,
        dailyActivity: days,
        activityDays: ACTIVITY_DAYS,
        fetchedAt: new Date().toISOString()
    };
};

module.exports = {
    getUserProfile,
    getUserRepos,
    getUserStats
};