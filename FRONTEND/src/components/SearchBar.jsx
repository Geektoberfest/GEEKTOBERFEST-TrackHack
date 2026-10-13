import { useState } from "react";

function SearchBar({ initialValue = "", onSearch }) {
    const [text, setText] = useState(initialValue);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(text.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
            <input
                type="text"
                placeholder="Search by title, organizer, description or location"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 bg-white"
            />
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                Search
            </button>
        </form>
    );
}

export default SearchBar;