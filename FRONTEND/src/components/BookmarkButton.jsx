import { useState } from "react";
import { useBookmarks } from "../context/BookmarkContext";

// onChange is optional; the Saved page uses it to drop a card when it's removed
function BookmarkButton({ hackathonId, onChange }) {
    const { isSaved, toggleSaved } = useBookmarks();
    const [error, setError] = useState("");
    const saved = isSaved(hackathonId);

    const handleClick = async () => {
        setError("");

        const message = await toggleSaved(hackathonId);
        if (message) {
            setError(message);
        } else if (onChange) {
            onChange(hackathonId);
        }
    };

    return (
        <span className="inline-flex flex-col items-end">
            <button
                type="button"
                onClick={handleClick}
                aria-pressed={saved}
                aria-label={saved ? "Remove from saved" : "Save hackathon"}
                title={saved ? "Remove from saved" : "Save hackathon"}
                className={"text-sm px-2 py-1 rounded border " + (saved ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-gray-300 text-gray-600 bg-white")}
            >
                {saved ? "★ Saved" : "☆ Save"}
            </button>
            {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
        </span>
    );
}

export default BookmarkButton;
