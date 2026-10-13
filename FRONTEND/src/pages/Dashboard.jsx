import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import HackathonCard from "../components/HackathonCard";
import ProgressBar from "../components/ProgressBar";
import EmptyState from "../components/EmptyState";
import { trackersToCsv, downloadCsv } from "../utils/exportCsv";
import { sortOptions } from "../utils/sortOptions";

function Dashboard() {
    const [hackathons, setHackathons] = useState([]);
    const [trackers, setTrackers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sort, setSort] = useState("newest");

    useEffect(() => {
        const loadData = async () => {
            try {
                const trackerRes = await api.get("/trackers");
                setTrackers(trackerRes.data.trackers.filter((tracker) => tracker.hackathon));
            } catch (err) {
                setError(err.response?.data?.message || "Could not load your dashboard");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // reload only the hackathon list when the sort changes
    useEffect(() => {
        const loadHackathons = async () => {
            try {
                const res = await api.get("/hackathons", { params: { mine: "true", sort } });
                setHackathons(res.data.hackathons);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load your hackathons");
            }
        };

        loadHackathons();
    }, [sort]);

    const stats = [
        { label: "Total Hackathons", value: hackathons.length },
        { label: "Upcoming", value: hackathons.filter((h) => h.status === "Upcoming").length },
        { label: "Ongoing", value: hackathons.filter((h) => h.status === "In Progress").length },
        { label: "Completed", value: hackathons.filter((h) => h.status === "Completed").length }
    ];

    const handleExport = () => {
        const today = new Date().toISOString().slice(0, 10);
        downloadCsv("trackhack-trackers-" + today + ".csv", trackersToCsv(trackers));
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {error && <p className="text-red-600">{error}</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-lg shadow p-4">
                        <p className="text-3xl font-bold text-indigo-600">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">My progress</h2>
                    <button
                        onClick={handleExport}
                        disabled={trackers.length === 0}
                        className="border border-gray-300 px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                        Export CSV
                    </button>
                </div>
                {trackers.length === 0 ? (
                    <EmptyState
                        title="No trackers yet"
                        message='Open a hackathon and click "Track my progress" to start tracking it here.'
                        actionLabel="Browse hackathons"
                        actionTo="/hackathons"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trackers.map((tracker) => (
                            <Link
                                key={tracker._id}
                                to={"/trackers/" + tracker._id}
                                className="bg-white rounded-lg shadow p-4 flex flex-col gap-2"
                            >
                                <h3 className="font-semibold">{tracker.hackathon.title}</h3>
                                <ProgressBar tracker={tracker} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">My hackathons</h2>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            aria-label="Sort my hackathons"
                            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        >
                            {sortOptions.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                    <Link to="/hackathons/create" className="text-indigo-600 font-medium">
                        + Add hackathon
                    </Link>
                </div>
                {hackathons.length === 0 ? (
                    <EmptyState
                        title="No hackathons yet"
                        message="Add a hackathon you're interested in to keep all its details in one place."
                        actionLabel="Add your first hackathon"
                        actionTo="/hackathons/create"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hackathons.map((hackathon) => (
                            <HackathonCard key={hackathon._id} hackathon={hackathon} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;