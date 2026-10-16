import { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const inputClass = "w-full border border-gray-300 rounded px-3 py-2";

const modeOptions = ["Online", "Offline", "Hybrid"];

function toCommaText(value) {
    if (!value) {
        return "";
    }
    if (Array.isArray(value)) {
        return value.join(", ");
    }
    return value;
}

function Profile() {
    const { user, updateUser } = useAuth();

    const [name, setName] = useState(user?.name || "");
    const [githubUsername, setGithubUsername] = useState(user?.githubUsername || "");
    const [skills, setSkills] = useState(toCommaText(user?.skills));
    const [interests, setInterests] = useState(toCommaText(user?.interests));
    const [preferredModes, setPreferredModes] = useState(user?.preferredModes || []);
    const [preferredLocation, setPreferredLocation] = useState(user?.preferredLocation || "");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const toggleMode = (mode) => {
        setPreferredModes((current) =>
            current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setSaving(true);

        try {
            const res = await api.put("/auth/me", {
                name,
                githubUsername,
                skills: skills.split(",").map((item) => item.trim()).filter(Boolean),
                interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
                preferredModes,
                preferredLocation
            });
            updateUser({
                ...user,
                name: res.data.user.name,
                githubUsername: res.data.user.githubUsername,
                skills: res.data.user.skills,
                interests: res.data.user.interests,
                preferredModes: res.data.user.preferredModes,
                preferredLocation: res.data.user.preferredLocation
            });
            setMessage("Profile updated. Your recommendations will use these preferences.");
        } catch (err) {
            setError(err.response?.data?.message || "Could not update profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-1">My profile</h1>
            <p className="text-sm text-gray-600 mb-4">
                Add your skills, interests, and preferences to get personalized hackathon recommendations.
            </p>

            {error && <p className="text-red-600 mb-3">{error}</p>}
            {message && <p className="text-green-700 mb-3">{message}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="githubUsername" className="block text-sm font-medium mb-1">GitHub username</label>
                    <input
                        id="githubUsername"
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="skills" className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
                    <input
                        id="skills"
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="React, Python, UI design"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="interests" className="block text-sm font-medium mb-1">Interests (comma-separated)</label>
                    <input
                        id="interests"
                        type="text"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="AI, Web3, Sustainability"
                        className={inputClass}
                    />
                </div>

                <div>
                    <span className="block text-sm font-medium mb-1">Preferred modes</span>
                    <div className="flex flex-wrap gap-2">
                        {modeOptions.map((mode) => (
                            <label key={mode} className="flex items-center gap-1 text-sm border border-gray-300 rounded px-3 py-1">
                                <input
                                    type="checkbox"
                                    checked={preferredModes.includes(mode)}
                                    onChange={() => toggleMode(mode)}
                                />
                                {mode}
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="preferredLocation" className="block text-sm font-medium mb-1">Preferred location</label>
                    <input
                        id="preferredLocation"
                        type="text"
                        value={preferredLocation}
                        onChange={(e) => setPreferredLocation(e.target.value)}
                        placeholder="Bengaluru, Remote, ..."
                        className={inputClass}
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save profile"}
                </button>
            </form>
        </div>
    );
}

export default Profile;
