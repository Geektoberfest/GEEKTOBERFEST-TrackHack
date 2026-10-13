import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/formatDate";

function HackathonDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hackathon, setHackathon] = useState(null);
    const [tracker, setTracker] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await api.get("/hackathons/" + id);
                setHackathon(res.data.hackathon);

                const trackerRes = await api.get("/trackers?hackathon=" + id);
                if (trackerRes.data.trackers.length > 0) {
                    setTracker(trackerRes.data.trackers[0]);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Could not load hackathon");
            }
        };

        loadData();
    }, [id]);

    const handleTrack = async () => {
        try {
            const res = await api.post("/trackers", { hackathon: id });
            navigate("/trackers/" + res.data.tracker._id);
        } catch (err) {
            setError(err.response?.data?.message || "Could not create tracker");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this hackathon?")) {
            return;
        }

        try {
            await api.delete("/hackathons/" + id);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete hackathon");
        }
    };

    if (error && !hackathon) {
        return <p className="text-red-600">{error}</p>;
    }

    if (!hackathon) {
        return <p>Loading...</p>;
    }

    const isOwner = hackathon.createdBy && hackathon.createdBy._id === user.id;
    const canManage = isOwner || user.role === "admin";
    const hasValidWebsite = hackathon.website && hackathon.website.startsWith("http");

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 flex flex-col gap-4">
            {error && <p className="text-red-600">{error}</p>}

            <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl font-bold">{hackathon.title}</h1>
                <StatusBadge status={hackathon.status} />
            </div>

            <p className="text-gray-600">Organized by {hackathon.organizer}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Mode:</span> {hackathon.mode}</p>
                <p><span className="font-medium">Location:</span> {hackathon.location || "Not specified"}</p>
                <p><span className="font-medium">Starts:</span> {formatDate(hackathon.startDate)}</p>
                <p><span className="font-medium">Ends:</span> {formatDate(hackathon.endDate)}</p>
                <p>
                    <span className="font-medium">Registration deadline:</span> {formatDate(hackathon.registrationDeadline)}
                </p>
                <p><span className="font-medium">Added by:</span> {hackathon.createdBy ? hackathon.createdBy.name : "Unknown"}</p>
            </div>

            {hasValidWebsite && (
                <a href={hackathon.website} target="_blank" rel="noreferrer" className="text-indigo-600">
                    Visit website
                </a>
            )}

            {hackathon.description && <p className="whitespace-pre-line">{hackathon.description}</p>}

            <div className="flex flex-wrap gap-3 pt-2">
                {tracker ? (
                    <Link to={"/trackers/" + tracker._id} className="bg-indigo-600 text-white px-4 py-2 rounded">
                        Open my tracker
                    </Link>
                ) : (
                    <button onClick={handleTrack} className="bg-indigo-600 text-white px-4 py-2 rounded">
                        Track my progress
                    </button>
                )}

                {canManage && (
                    <>
                        <Link to={"/hackathons/" + id + "/edit"} className="border border-gray-300 px-4 py-2 rounded">
                            Edit
                        </Link>
                        <button onClick={handleDelete} className="border border-red-500 text-red-600 px-4 py-2 rounded">
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default HackathonDetails;