import { describe, test, expect } from "vitest";
import { formatDate, formatDateRange } from "./formatDate";

describe("formatDate", () => {
    test("formats a valid date", () => {
        expect(formatDate("2026-11-01")).toBe(
            new Date("2026-11-01").toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            })
        );
    });

    test("falls back to TBA for missing values", () => {
        expect(formatDate(null)).toBe("TBA");
        expect(formatDate(undefined)).toBe("TBA");
        expect(formatDate("")).toBe("TBA");
    });

    test("falls back to TBA for invalid dates", () => {
        expect(formatDate("not-a-date")).toBe("TBA");
        expect(formatDate("2026-13-45")).toBe("TBA");
    });
});

describe("formatDateRange", () => {
    test("joins a normal range with to", () => {
        const range = formatDateRange("2026-11-01", "2026-11-03");

        expect(range).toBe(formatDate("2026-11-01") + " to " + formatDate("2026-11-03"));
    });

    test("collapses a single-day event to one date", () => {
        expect(formatDateRange("2026-11-01", "2026-11-01")).toBe(formatDate("2026-11-01"));
    });

    test("handles one-sided dates gracefully", () => {
        expect(formatDateRange("2026-11-01", null)).toBe("Starts " + formatDate("2026-11-01"));
        expect(formatDateRange(null, "2026-11-03")).toBe("Ends " + formatDate("2026-11-03"));
    });

    test("handles invalid dates gracefully", () => {
        expect(formatDateRange("garbage", null)).toBe("Dates TBA");
        expect(formatDateRange("2026-11-01", "garbage")).toBe(
            "Starts " + formatDate("2026-11-01")
        );
    });

    test("shows Dates TBA when both dates are missing", () => {
        expect(formatDateRange(null, null)).toBe("Dates TBA");
        expect(formatDateRange(undefined, undefined)).toBe("Dates TBA");
    });
});
