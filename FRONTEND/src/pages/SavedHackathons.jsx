import { useEffect, useState } from "react";
import api from "../api";
import HackathonCard from "../components/HackathonCard";
import EmptyState from "../components/EmptyState";

function SavedHackathons() {
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadSaved = async () => {
            try {
                const res = await api.get("/bookmarks");
                setHackathons(res.data.hackathons);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load your saved hackathons");
            } finally {
                setLoading(false);
            }
        };

        loadSaved();
    }, []);

    // remove the card straight away when it's unsaved on this page
    const handleUnsaved = (hackathonId) => {
        setHackathons((current) => current.filter((hackathon) => hackathon._id !== hackathonId));
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Saved Hackathons</h1>

            {error && <p className="text-red-600">{error}</p>}

            {hackathons.length === 0 ? (
                <EmptyState
                    title="Nothing saved yet"
                    message="Save hackathons you're interested in and they'll show up here."
                    actionLabel="Browse hackathons"
                    actionTo="/hackathons"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hackathons.map((hackathon) => (
                        <HackathonCard key={hackathon._id} hackathon={hackathon} onUnsaved={handleUnsaved} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default SavedHackathons;
