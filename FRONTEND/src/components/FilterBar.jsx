const statuses = ["Upcoming", "Registered", "In Progress", "Completed", "Cancelled"];
const modes = ["Online", "Offline", "Hybrid"];
const sorts = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "startDate", label: "Start date (soonest)" },
    { value: "-startDate", label: "Start date (latest)" },
    { value: "deadline", label: "Registration deadline" },
    { value: "title", label: "Title (A-Z)" }
];

function FilterBar({ filters, onChange }) {
    return (
        <div className="flex flex-wrap items-end gap-3">
            <select
                value={filters.status}
                onChange={(e) => onChange("status", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 bg-white"
            >
                <option value="">All statuses</option>
                {statuses.map((item) => (
                    <option key={item} value={item}>{item}</option>
                ))}
            </select>

            <select
                value={filters.mode}
                onChange={(e) => onChange("mode", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 bg-white"
            >
                <option value="">All modes</option>
                {modes.map((item) => (
                    <option key={item} value={item}>{item}</option>
                ))}
            </select>

            <label className="flex flex-col text-sm text-gray-600">
                Starts from
                <input
                    type="date"
                    value={filters.startFrom}
                    max={filters.startTo || undefined}
                    onChange={(e) => onChange("startFrom", e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
                />
            </label>

            <label className="flex flex-col text-sm text-gray-600">
                Starts before
                <input
                    type="date"
                    value={filters.startTo}
                    min={filters.startFrom || undefined}
                    onChange={(e) => onChange("startTo", e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
                />
            </label>

            <select
                value={filters.sort}
                onChange={(e) => onChange("sort", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 bg-white"
            >
                {sorts.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                ))}
            </select>
        </div>
    );
}

export default FilterBar;
