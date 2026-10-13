import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="bg-indigo-600 text-white">
            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <Link to={user ? "/dashboard" : "/login"} className="text-xl font-bold">
                    HackTrack
                </Link>
                {user ? (
                    <div className="flex flex-wrap items-center gap-4">
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/hackathons">Hackathons</Link>
                        <Link to="/hackathons/create">Add Hackathon</Link>
                        {isAdmin && <Link to="/admin">Admin</Link>}
                        <span className="text-indigo-200">{user.name}</span>
                        <button onClick={handleLogout} className="bg-white text-indigo-600 px-3 py-1 rounded">
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;