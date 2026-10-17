import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import EmptyState from "../components/EmptyState";

function Teams() {
    const [teams, setTeams] = useState([]);
    const [invites, setInvites] = useState([]);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pendingId, setPendingId] = useState(null);

    const loadTeams = async () => {
        const [teamsRes, invitesRes] = await Promise.all([api.get("/teams"), api.get("/teams/invites")]);
        setTeams(teamsRes.data.teams);
        setInvites(invitesRes.data.invites);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                await loadTeams();
            } catch (err) {
                setError(err.response?.data?.message || "Could not load teams");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await api.post("/teams", { name });
            setName("");
            await loadTeams();
        } catch (err) {
            setError(err.response?.data?.message || "Could not create team");
        }
    };

    const handleInvite = async (inviteId, action) => {
        setError("");
        setPendingId(inviteId);

        try {
            await api.post("/teams/invites/" + inviteId + "/" + action);
            await loadTeams();
        } catch (err) {
            setError(err.response?.data?.message || "Could not update invite");
        } finally {
            setPendingId(null);
        }
    };

    if (loading) {
        return <p>Loading teams...</p>;
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Teams</h1>

            {error && <p className="text-red-600">{error}</p>}

            {invites.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="font-semibold">Team invites</h2>
                    {invites.map((invite) => (
                        <div key={invite._id} className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center justify-between gap-3">
                            <p>
                                <span className="font-medium">{invite.team ? invite.team.name : "A team"}</span>
                                {invite.invitedBy && <span className="text-gray-600"> · invited by {invite.invitedBy.name}</span>}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleInvite(invite._id, "accept")}
                                    disabled={pendingId === invite._id}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleInvite(invite._id, "decline")}
                                    disabled={pendingId === invite._id}
                                    className="border border-gray-300 px-3 py-1 rounded disabled:opacity-50"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-2">
                <input
                    aria-label="Team name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    placeholder="New team name"
                    className="flex-1 min-w-48 border border-gray-300 rounded px-3 py-2"
                />
                <button type="submit" disabled={!name.trim()} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">
                    Create team
                </button>
            </form>

            {teams.length === 0 ? (
                <EmptyState
                    title="No teams yet"
                    message="Create a team or accept an invite to start collaborating on hackathons."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => (
                        <Link key={team._id} to={"/teams/" + team._id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-1 hover:shadow-md">
                            <span className="font-semibold text-lg">{team.name}</span>
                            <span className="text-sm text-gray-600">
                                {team.memberCount} {team.memberCount === 1 ? "member" : "members"} · you are {team.myRole}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Teams;
