import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [githubUsername, setGithubUsername] = useState("");
    const [error, setError] = useState("");
    const { saveLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await api.post("/auth/register", { name, email, password, githubUsername });
            saveLogin(res.data.token, res.data.user);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">Create an account</h1>
            {error && <p className="text-red-600 mb-3">{error}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <PasswordInput
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
                <input
                    type="text"
                    placeholder="GitHub username (optional)"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Register
                </button>
            </form>
            <p className="mt-4 text-sm">
                Already have an account? <Link to="/login" className="text-indigo-600">Login</Link>
            </p>
        </div>
    );
}

export default Register;