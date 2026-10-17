import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import BookmarkButton from "../components/BookmarkButton";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatDate } from "../utils/formatDate";

function HackathonDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hackathon, setHackathon] = useState(null);
    const [tracker, setTracker] = useState(null);
    const [error, setError] = useState("");
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [managedTeams, setManagedTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");

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

    // teams the user can attach to this hackathon; the section still works without them
    useEffect(() => {
        const loadTeams = async () => {
            try {
                const res = await api.get("/teams");
                setManagedTeams(res.data.teams.filter((team) => team.myRole === "owner" || team.myRole === "admin"));
            } catch {
                setManagedTeams([]);
            }
        };

        loadTeams();
    }, []);

    const handleAddTeam = async () => {
        try {
            await api.post("/teams/" + selectedTeamId + "/hackathons", { hackathon: id });
            const team = managedTeams.find((item) => item._id === selectedTeamId);
            setHackathon({ ...hackathon, teams: [...hackathon.teams, { _id: team._id, name: team.name }] });
            setSelectedTeamId("");
        } catch (err) {
            setError(err.response?.data?.message || "Could not add team");
        }
    };

    const handleRemoveTeam = async (teamId) => {
        try {
            await api.delete("/teams/" + teamId + "/hackathons/" + id);
            setHackathon({ ...hackathon, teams: hackathon.teams.filter((team) => team._id !== teamId) });
        } catch (err) {
            setError(err.response?.data?.message || "Could not remove team");
        }
    };

    const handleTrack = async () => {
        try {
            const res = await api.post("/trackers", { hackathon: id });
            navigate("/trackers/" + res.data.tracker._id);
        } catch (err) {
            setError(err.response?.data?.message || "Could not create tracker");
        }
    };

    const handleDelete = async () => {
        setDeleting(true);

        try {
            await api.delete("/hackathons/" + id);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete hackathon");
            setConfirmingDelete(false);
            setDeleting(false);
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
    const attachedTeams = Array.isArray(hackathon.teams) ? hackathon.teams : [];
    const manageableIds = managedTeams.map((team) => team._id);
    const addableTeams = managedTeams.filter((team) => !attachedTeams.some((attached) => attached._id === team._id));

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

            {Array.isArray(hackathon.tags) && hackathon.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {hackathon.tags.map((tag) => (
                        <span key={tag} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <section className="flex flex-col gap-2">
                <h2 className="font-semibold">Teams</h2>
                {attachedTeams.length === 0 ? (
                    <p className="text-sm text-gray-600">No teams are working on this hackathon yet.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {attachedTeams.map((team) => (
                            <span key={team._id} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                                {team.name}
                                {manageableIds.includes(team._id) && (
                                    <button
                                        onClick={() => handleRemoveTeam(team._id)}
                                        aria-label={"Remove " + team.name + " from this hackathon"}
                                        className="text-red-600 font-bold"
                                    >
                                        ×
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                )}

                {addableTeams.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <select
                            aria-label="Team to add"
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                            <option value="">Add one of your teams</option>
                            {addableTeams.map((team) => (
                                <option key={team._id} value={team._id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAddTeam}
                            disabled={!selectedTeamId}
                            className="border border-gray-300 px-3 py-1 rounded disabled:opacity-50"
                        >
                            Add team
                        </button>
                    </div>
                )}
            </section>

            <div className="flex flex-wrap gap-3 pt-2">
                <BookmarkButton hackathonId={hackathon._id} />
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
                        <button onClick={() => setConfirmingDelete(true)} className="border border-red-500 text-red-600 px-4 py-2 rounded">
                            Delete
                        </button>
                    </>
                )}
            </div>

            {confirmingDelete && (
                <ConfirmDialog
                    title="Delete hackathon?"
                    message={'Delete "' + hackathon.title + '"? This cannot be undone.'}
                    confirmLabel="Delete hackathon"
                    confirming={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmingDelete(false)}
                />
            )}
        </div>
    );
}

export default HackathonDetails;