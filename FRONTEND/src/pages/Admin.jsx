import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function Admin() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [pendingId, setPendingId] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await api.get("/admin/users");
                setUsers(res.data.users);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load users");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleRoleChange = async (id, role) => {
        setError("");
        setNotice("");
        setPendingId(id);

        try {
            const res = await api.patch("/admin/users/" + id + "/role", { role });
            setUsers(users.map((u) => (u._id === id ? { ...u, role: res.data.user.role } : u)));
            setNotice("Role updated for " + res.data.user.email);
        } catch (err) {
            setError(err.response?.data?.message || "Could not update role");
        } finally {
            setPendingId(null);
        }
    };

    const handleDelete = async (id, email) => {
        if (!window.confirm("Delete user " + email + "? Their trackers will be removed.")) {
            return;
        }

        setError("");
        setNotice("");
        setPendingId(id);

        try {
            await api.delete("/admin/users/" + id);
            setUsers(users.filter((u) => u._id !== id));
            setNotice("Deleted " + email);
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete user");
        } finally {
            setPendingId(null);
        }
    };

    if (loading) {
        return <p>Loading users...</p>;
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <h1 className="text-2xl font-bold">User management</h1>

            {error && <p className="text-red-600">{error}</p>}
            {notice && <p className="text-green-700">{notice}</p>}

            {users.length === 0 ? (
                <p className="text-gray-600">No users found.</p>
            ) : (
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
                            {users.map((u) => {
                                const isSelf = currentUser && u._id === currentUser.id;
                                return (
                                    <tr key={u._id} className="border-b border-gray-100">
                                        <td className="px-4 py-2">{u.name}</td>
                                        <td className="px-4 py-2">{u.email}</td>
                                        <td className="px-4 py-2">
                                            <select
                                                aria-label={"Role for " + u.email}
                                                value={u.role || "user"}
                                                disabled={isSelf || pendingId === u._id}
                                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1 bg-white disabled:opacity-50"
                                            >
                                                <option value="user">user</option>
                                                <option value="admin">admin</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => handleDelete(u._id, u.email)}
                                                disabled={isSelf || pendingId === u._id}
                                                className="border border-red-500 text-red-600 px-3 py-1 rounded disabled:opacity-50"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Admin;
