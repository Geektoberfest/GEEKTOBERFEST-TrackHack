import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";
import MonthlyBarChart from "../components/MonthlyBarChart";

function StatTile({ label, value }) {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            <p className="text-3xl font-bold text-indigo-600">{value}</p>
            <p className="text-sm text-gray-600">{label}</p>
        </div>
    );
}

function Analytics() {
    const { isAdmin } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [includeAll, setIncludeAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadAnalytics = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await api.get("/analytics/me", { params: includeAll ? { all: "true" } : {} });
                setAnalytics(res.data);
            } catch (err) {
                setAnalytics(null);
                setError(err.response?.data?.message || "Could not load analytics");
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [includeAll]);

    if (loading && !analytics) {
        return <p>Loading analytics...</p>;
    }

    const adminToggle = isAdmin && (
        <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeAll} onChange={(e) => setIncludeAll(e.target.checked)} />
            Include all users
        </label>
    );

    if (!analytics) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold">Analytics</h1>
                {error && <p className="text-red-600">{error}</p>}
            </div>
        );
    }

    const { totals, statusCounts, monthly } = analytics;
    const statusTotal = statusCounts.reduce((sum, item) => sum + item.count, 0);

    if (totals.tracked === 0) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    {adminToggle}
                </div>
                <EmptyState
                    title="No analytics yet"
                    message="Track a hackathon to see your participation, monthly activity and success rate here."
                    actionLabel="Browse hackathons"
                    actionTo="/hackathons"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p className="text-sm text-gray-600">{analytics.scope === "all" ? "All users" : "Your tracked hackathons"}</p>
                </div>
                {adminToggle}
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatTile label="Tracked" value={totals.tracked} />
                <StatTile label="Successful" value={totals.successful} />
                <StatTile label="Success rate" value={totals.successRate === null ? "—" : totals.successRate + "%"} />
                <StatTile label="Completed" value={statusCounts.find((item) => item.status === "Completed").count} />
            </div>

            <section className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
                <h2 className="font-semibold">Monthly activity</h2>
                <p className="text-sm text-gray-600">Hackathons tracked per month, last 12 months.</p>
                <MonthlyBarChart months={monthly} />
            </section>

            <section className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
                <h2 className="font-semibold">Participation status</h2>
                {statusCounts.map((item) => {
                    const percent = statusTotal > 0 ? Math.round((item.count / statusTotal) * 100) : 0;
                    return (
                        <div key={item.status}>
                            <div className="flex justify-between text-sm text-gray-700 mb-1">
                                <span>{item.status}</span>
                                <span>
                                    {item.count} ({percent}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: percent + "%" }}></div>
                            </div>
                        </div>
                    );
                })}
            </section>
        </div>
    );
}

export default Analytics;
