import { Link } from "react-router-dom";

function EmptyState({ title, message, actionLabel, actionTo }) {
    return (
        <div className="bg-white rounded-lg shadow p-6 text-center flex flex-col items-center gap-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-gray-600">{message}</p>
            {actionLabel && actionTo && (
                <Link to={actionTo} className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}

export default EmptyState;
