function formatDay(date) {
    return new Date(date + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

// column chart of public GitHub events per day
function ActivityChart({ days }) {
    const max = Math.max(1, ...days.map((day) => day.count));

    return (
        <div>
            <div className="flex items-end gap-1 h-40 border-b border-gray-300" role="img" aria-label="Public GitHub events per day">
                {days.map((day) => (
                    <div key={day.date} className="group relative flex-1 h-full flex items-end">
                        <div
                            className={"w-full rounded-t " + (day.count ? "bg-indigo-600 group-hover:bg-indigo-800" : "bg-gray-100")}
                            style={{ height: day.count ? Math.max(4, (day.count / max) * 100) + "%" : "2px" }}
                        ></div>
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-xs rounded px-2 py-1 z-10">
                            {formatDay(day.date)}: {day.count} {day.count === 1 ? "event" : "events"}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatDay(days[0].date)}</span>
                <span>{formatDay(days[days.length - 1].date)}</span>
            </div>

            <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-indigo-600">View as table</summary>
                <table className="mt-2 w-full text-left">
                    <thead>
                        <tr className="text-gray-600">
                            <th className="py-1">Date</th>
                            <th className="py-1">Events</th>
                        </tr>
                    </thead>
                    <tbody>
                        {days.filter((day) => day.count > 0).map((day) => (
                            <tr key={day.date} className="border-t border-gray-100">
                                <td className="py-1">{formatDay(day.date)}</td>
                                <td className="py-1">{day.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
}

export default ActivityChart;
