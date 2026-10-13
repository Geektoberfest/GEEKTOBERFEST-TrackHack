import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ActivityChart from "../components/ActivityChart";

function StatTile({ label, value }) {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            <p className="text-3xl font-bold text-indigo-600">{value}</p>
            <p className="text-sm text-gray-600">{label}</p>
        </div>
    );
}

function GitHubDashboard() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    // show the logged-in user's GitHub account unless another username is in the URL
    const username = searchParams.get("user") || user?.githubUsername || "";

    const [text, setText] = useState(username);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        if (!username) {
            return;
        }

        const loadStats = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await api.get("/github/stats/" + encodeURIComponent(username));
                setStats(res.data.stats);
            } catch (err) {
                setStats(null);
                setError(err.response?.data?.message || "Could not load GitHub stats");
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [username, reload]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            setSearchParams({ user: text.trim() });
        }
    };

    const activityItems = stats
        ? [
              { label: "Pushes", value: stats.activity.pushes },
              { label: "Pull requests opened", value: stats.activity.pullRequests },
              { label: "PR reviews", value: stats.activity.reviews },
              { label: "Issues opened", value: stats.activity.issues },
              { label: "Comments", value: stats.activity.comments },
              { label: "Repos/branches created", value: stats.activity.created }
          ]
        : [];
    const maxLanguage = stats && stats.languages.length ? stats.languages[0].repos : 1;
    const hasActivity = stats && stats.dailyActivity.some((day) => day.count > 0);

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-bold">GitHub Activity</h1>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    placeholder="GitHub username"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 bg-white"
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Show stats
                </button>
            </form>

            {!username && (
                <p className="text-gray-600">
                    Enter a GitHub username above to see repository and contribution stats.
                </p>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 flex items-center justify-between gap-3">
                    <span>{error}</span>
                    <button onClick={() => setReload(reload + 1)} className="border border-red-300 px-3 py-1 rounded bg-white">
                        Try again
                    </button>
                </div>
            )}

            {loading && <p>Loading...</p>}

            {stats && !loading && (
                <>
                    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                        <img src={stats.profile.avatarUrl} alt="" className="w-16 h-16 rounded-full" />
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold">{stats.profile.name || stats.profile.username}</h2>
                            <a href={stats.profile.profileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm">
                                @{stats.profile.username}
                            </a>
                            {stats.profile.bio && <p className="text-gray-600 text-sm mt-1">{stats.profile.bio}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatTile label="Public repos" value={stats.repoStats.totalRepos} />
                        <StatTile label="Stars earned" value={stats.repoStats.totalStars} />
                        <StatTile label="Forks of their repos" value={stats.repoStats.totalForks} />
                        <StatTile label="Followers" value={stats.profile.followers} />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-3">Activity in the last {stats.activityDays} days</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {activityItems.map((item) => (
                                <StatTile key={item.label} label={item.label} value={item.value} />
                            ))}
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold mb-3">Public events per day</h3>
                            {hasActivity ? (
                                <ActivityChart days={stats.dailyActivity} />
                            ) : (
                                <p className="text-gray-600">No public activity in the last {stats.activityDays} days.</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="font-semibold mb-3">Top languages (by repos)</h2>
                            {stats.languages.length === 0 ? (
                                <p className="text-gray-600">No languages found.</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {stats.languages.map((item) => (
                                        <div key={item.language}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{item.language}</span>
                                                <span className="text-gray-600">{item.repos}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full"
                                                    style={{ width: (item.repos / maxLanguage) * 100 + "%" }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="font-semibold mb-3">Top repositories</h2>
                            {stats.topRepos.length === 0 ? (
                                <p className="text-gray-600">No public repositories yet.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {stats.topRepos.map((repo) => (
                                        <a key={repo.name} href={repo.url} target="_blank" rel="noreferrer" className="block">
                                            <p className="font-medium text-indigo-600">{repo.name}</p>
                                            {repo.description && <p className="text-sm text-gray-600">{repo.description}</p>}
                                            <p className="text-xs text-gray-500">
                                                {repo.language || "No language"} · ★ {repo.stars} · Forks {repo.forks}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-gray-500">
                        Based on public GitHub data. Updated {new Date(stats.fetchedAt).toLocaleString("en-IN")}. Stats are
                        cached for up to 10 minutes.
                    </p>
                </>
            )}
        </div>
    );
}

export default GitHubDashboard;
