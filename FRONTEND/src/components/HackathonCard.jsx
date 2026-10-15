import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatDateRange } from "../utils/formatDate";
import BookmarkButton from "./BookmarkButton";

function HackathonCard({ hackathon, recommendation }) {
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