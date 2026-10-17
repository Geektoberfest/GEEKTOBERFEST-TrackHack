// "2026-05" -> "May 26"
function formatMonth(month) {
    return new Date(month + "-01T00:00:00Z").toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });
}

// column chart of hackathons tracked per month, same styling as ActivityChart
function MonthlyBarChart({ months }) {
    const max = Math.max(1, ...months.map((item) => item.count));

    return (
        <div>
            <div className="flex items-end gap-1 h-40 border-b border-gray-300" role="img" aria-label="Hackathons tracked per month">
                {months.map((item) => (
                    <div key={item.month} className="group relative flex-1 h-full flex items-end">
                        <div
                            className={"w-full rounded-t " + (item.count ? "bg-indigo-600 group-hover:bg-indigo-800" : "bg-gray-100")}
                            style={{ height: item.count ? Math.max(4, (item.count / max) * 100) + "%" : "2px" }}
                        ></div>
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-xs rounded px-2 py-1 z-10">
                            {formatMonth(item.month)}: {item.count} {item.count === 1 ? "hackathon" : "hackathons"}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatMonth(months[0].month)}</span>
                <span>{formatMonth(months[months.length - 1].month)}</span>
            </div>
        </div>
    );
}

export default MonthlyBarChart;
