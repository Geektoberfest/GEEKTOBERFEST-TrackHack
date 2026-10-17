import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatDateRange } from "../utils/formatDate";
import BookmarkButton from "./BookmarkButton";

function HackathonCard({ hackathon, recommendation, onUnsaved }) {
    const tags = Array.isArray(hackathon.tags) ? hackathon.tags : [];
    const reasons = recommendation?.reasons || [];

    return (
        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold">{hackathon.title}</h3>
                <StatusBadge status={hackathon.status} />
            </div>
            <p className="text-sm text-gray-600">{hackathon.organizer}</p>
            <p className="text-sm text-gray-500">
                {hackathon.mode} • {formatDateRange(hackathon.startDate, hackathon.endDate)}
            </p>
            {recommendation && (
                <p className="text-sm font-medium text-indigo-700">
                    Match score: {recommendation.score}
                </p>
            )}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                        <span key={tag} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
            {reasons.length > 0 && (
                <ul className="text-xs text-gray-600 list-disc list-inside">
                    {reasons.slice(0, 3).map((reason) => (
                        <li key={reason}>{reason}</li>
                    ))}
                </ul>
            )}
            <div className="flex items-center justify-between gap-2">
                <Link to={"/hackathons/" + hackathon._id} className="text-indigo-600 text-sm font-medium">
                    View details
                </Link>
                <BookmarkButton hackathonId={hackathon._id} onChange={onUnsaved} />
            </div>
        </div>
    );
}

export default HackathonCard;