const FALLBACK = "TBA";

export function formatDate(date) {
    if (!date) {
        return FALLBACK;
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return FALLBACK;
    }

    return parsed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

export function formatDateRange(startDate, endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    if (start === FALLBACK && end === FALLBACK) {
        return "Dates TBA";
    }

    if (start === FALLBACK) {
        return "Ends " + end;
    }

    if (end === FALLBACK) {
        return "Starts " + start;
    }

    if (start === end) {
        return start;
    }

    return start + " to " + end;
}
