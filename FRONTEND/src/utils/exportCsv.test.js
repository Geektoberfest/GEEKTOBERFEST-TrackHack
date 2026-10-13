import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { trackersToCsv, downloadCsv } from "./exportCsv";

const tracker = {
    finalResult: "Shortlisted",
    notes: "Going well",
    ideaSubmitted: true,
    teamFormed: true,
    hackathon: {
        title: "Geek Hack 2026",
        organizer: "Geektoberfest",
        status: "In Progress",
        mode: "Online",
        startDate: "2026-11-01",
        endDate: "2026-11-03"
    }
};

describe("trackersToCsv", () => {
    test("writes the header row", () => {
        const [header] = trackersToCsv([]).split("\r\n");

        expect(header).toBe(
            "Hackathon,Organizer,Status,Mode,Start date,End date,Steps completed,Progress,Final result,Notes"
        );
    });

    test("writes one row per tracker with progress", () => {
        const lines = trackersToCsv([tracker]).split("\r\n");

        expect(lines).toHaveLength(3);
        expect(lines[1]).toContain("Geek Hack 2026");
        expect(lines[1]).toContain("2 of 7");
        expect(lines[1]).toContain("29%");
        expect(lines[1]).toContain("Shortlisted");
    });

    test("escapes commas, quotes, and newlines", () => {
        const tricky = {
            ...tracker,
            notes: 'Said "hi", then\nleft'
        };
        const lines = trackersToCsv([tricky]).split("\r\n");

        expect(lines[1]).toContain('"Said ""hi"", then\nleft"');
    });

    test("handles missing hackathon and dates gracefully", () => {
        const bare = { finalResult: "Pending", notes: "" };
        const lines = trackersToCsv([bare]).split("\r\n");

        expect(lines[1]).toContain("TBA");
        expect(lines[1]).toContain("0 of 7");
        expect(lines[1]).toContain("0%");
    });
});

describe("downloadCsv", () => {
    beforeEach(() => {
        URL.createObjectURL = vi.fn().mockReturnValue("blob:fake");
        URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("triggers a download with the given filename", () => {
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

        downloadCsv("trackers.csv", "a,b\r\n");

        expect(URL.createObjectURL).toHaveBeenCalledOnce();
        expect(click).toHaveBeenCalledOnce();

        const link = click.mock.instances[0];
        expect(link.download).toBe("trackers.csv");
        expect(link.href).toContain("blob:fake");
        expect(document.body.contains(link)).toBe(false);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake");
    });
});
