import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import HackathonCard from "../components/HackathonCard";
import EmptyState from "../components/EmptyState";

function Recommended() {
    const [recommendations, setRecommendations] = useState([]);
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get("/hackathons/recommended", { params: { limit: 20 } });
                setRecommendations(res.data.recommendations || []);
                setProfileIncomplete(Boolean(res.data.profileIncomplete));
            } catch (err) {
                setError(err.response?.data?.message || "Could not load recommendations");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    if (loading) {
        return <p>Loading recommendations...</p>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-1">Recommended for you</h1>
            <p className="text-sm text-gray-600 mb-4">
                Ranked by how well each hackathon matches your skills, interests, and preferences.
            </p>

            {error && <p className="text-red-600 mb-3">{error}</p>}

            {profileIncomplete && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-indigo-900">
                        Add your skills and interests to get sharper recommendations.{" "}
                        <Link to="/profile" className="font-medium underline">
                            Complete your profile
                        </Link>
                    </p>
                </div>
            )}

            {recommendations.length === 0 ? (
                <EmptyState
                    title="No recommendations yet"
                    message="There are no upcoming hackathons to suggest right now. Check back later or add one."
                    actionLabel="Browse hackathons"
                    actionTo="/hackathons"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((item) => (
                        <HackathonCard
                            key={item.hackathon._id}
                            hackathon={item.hackathon}
                            recommendation={item}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Recommended;
