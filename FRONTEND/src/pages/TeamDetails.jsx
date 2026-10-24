import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";

const roleOptions = ["owner", "admin", "member"];

function TeamDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [team, setTeam] = useState(null);
    const [myRole, setMyRole] = useState("member");
    const [invites, setInvites] = useState([]);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [pendingId, setPendingId] = useState(null);
    const [confirmingLeave, setConfirmingLeave] = useState(false);

    const loadTeam = useCallback(async () => {
        const res = await api.get("/teams/" + id);
        setTeam(res.data.team);
        setMyRole(res.data.myRole);
        setInvites(res.data.invites);
    }, [id]);

    useEffect(() => {
        const loadData = async () => {
            try {
                await loadTeam();
            } catch (err) {
                setError(err.response?.data?.message || "Could not load team");
            }
        };

        loadData();
    }, [loadTeam]);

    const run = async (key, request, successMessage) => {
        setError("");
        setNotice("");
        setPendingId(key);

        try {
            await request();
            setNotice(successMessage);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
            return false;
        } finally {
            setPendingId(null);
        }
    };

    const handleRoleChange = async (member, role) => {
        const changed = await run(member.user._id, () => api.patch("/teams/" + id + "/members/" + member.user._id + "/role", { role }), "Role updated");

        if (changed) {
            await loadTeam();
        }
    };

    const handleRemove = async (member) => {
        const removed = await run(member.user._id, () => api.delete("/teams/" + id + "/members/" + member.user._id), "Member removed");

        if (removed) {
            await loadTeam();
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        const sent = await run("invite", () => api.post("/teams/" + id + "/invites", { email }), "Invite sent");

        if (sent) {
            setEmail("");
            await loadTeam();
        }
    };

    const handleLeave = async () => {
        const left = await run("leave", () => api.post("/teams/" + id + "/leave"), "You left the team");

        if (left) {
            navigate("/teams");
        }
    };

    if (error && !team) {
        return <p className="text-red-600">{error}</p>;
    }

    if (!team) {
        return <p>Loading team...</p>;
    }

    const canManage = myRole === "owner" || myRole === "admin";
    const isOwner = myRole === "owner";

    // members can be removed by owners (anyone but themselves) and by admins (plain members only)
    const canRemove = (member) => {
        if (member.user._id === user.id) {
            return false;
        }
        if (isOwner) {
            return true;
        }
        return myRole === "admin" && member.role === "member";
    };

    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{team.name}</h1>
                    <p className="text-sm text-gray-600">You are {myRole}</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/teams" className="border border-gray-300 px-4 py-2 rounded">
                        All teams
                    </Link>
                    <button onClick={() => setConfirmingLeave(true)} className="border border-red-500 text-red-600 px-4 py-2 rounded">
                        Leave team
                    </button>
                </div>
            </div>

            {error && <p className="text-red-600">{error}</p>}
            {notice && <p className="text-green-700">{notice}</p>}

            <section className="flex flex-col gap-2">
                <h2 className="font-semibold">Members</h2>
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-gray-200">
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Role</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.members.map((member) => (
                                <tr key={member._id} className="border-b border-gray-100">
                                    <td className="px-4 py-2">{member.user ? member.user.name : "Unknown"}</td>
                                    <td className="px-4 py-2">{member.user ? member.user.email : ""}</td>
                                    <td className="px-4 py-2">
                                        {isOwner ? (
                                            <select
                                                aria-label={"Role for " + (member.user ? member.user.name : "member")}
                                                value={member.role}
                                                disabled={pendingId === member.user._id}
                                                onChange={(e) => handleRoleChange(member, e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1 bg-white disabled:opacity-50"
                                            >
                                                {roleOptions.map((role) => (
                                                    <option key={role} value={role}>
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            member.role
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        {canRemove(member) && (
                                            <button
                                                onClick={() => handleRemove(member)}
                                                disabled={pendingId === member.user._id}
                                                className="border border-red-500 text-red-600 px-3 py-1 rounded disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {canManage && (
                <section className="flex flex-col gap-3">
                    <h2 className="font-semibold">Invite a member</h2>
                    <form onSubmit={handleInvite} className="flex flex-wrap gap-2">
                        <input
                            type="email"
                            aria-label="Member email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            className="flex-1 min-w-48 border border-gray-300 rounded px-3 py-2"
                        />
                        <button type="submit" disabled={pendingId === "invite"} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">
                            Send invite
                        </button>
                    </form>

                    {invites.length > 0 && (
                        <ul className="text-sm text-gray-700 list-disc pl-5">
                            {invites.map((invite) => (
                                <li key={invite._id}>
                                    Pending: {invite.invitedUser ? invite.invitedUser.email : "unknown user"}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {confirmingLeave && (
                <ConfirmDialog
                    title="Leave team?"
                    message={'Leave "' + team.name + '"? You will need a new invite to rejoin.'}
                    confirmLabel="Leave team"
                    confirming={pendingId === "leave"}
                    onConfirm={handleLeave}
                    onCancel={() => setConfirmingLeave(false)}
                />
            )}
        </div>
    );
}

export default TeamDetails;
