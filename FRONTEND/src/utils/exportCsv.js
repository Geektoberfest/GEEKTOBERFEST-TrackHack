import { formatDate } from "./formatDate";
import { trackerSteps } from "../components/ProgressBar";

const COLUMNS = [
    "Hackathon",
    "Organizer",
    "Status",
    "Mode",
    "Start date",
    "End date",
    "Steps completed",
    "Progress",
    "Final result",
    "Notes"
];

function escapeCell(value) {
    const text = value === null || value === undefined ? "" : String(value);

    if (text.includes('"') || text.includes(",") || text.includes("\n") || text.includes("\r")) {
        return '"' + text.replace(/"/g, '""') + '"';
    }

    return text;
}

export function trackersToCsv(trackers) {
    const lines = [COLUMNS.map(escapeCell).join(",")];

    for (const tracker of trackers) {
        const hackathon = tracker.hackathon || {};
        const done = trackerSteps.filter((step) => tracker[step.key]).length;
        const percent = Math.round((done / trackerSteps.length) * 100);

        lines.push(
            [
                hackathon.title || "",
                hackathon.organizer || "",
                hackathon.status || "",
                hackathon.mode || "",
                formatDate(hackathon.startDate),
                formatDate(hackathon.endDate),
                done + " of " + trackerSteps.length,
                percent + "%",
                tracker.finalResult || "",
                tracker.notes || ""
            ]
                .map(escapeCell)
                .join(",")
        );
    }

    return lines.join("\r\n") + "\r\n";
}

export function downloadCsv(filename, csv) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
