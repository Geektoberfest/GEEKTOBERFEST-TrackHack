import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HackathonCard from "../components/HackathonCard";

const hackathon = {
    _id: "abc123",
    title: "Geek Hack 2026",
    organizer: "Geektoberfest",
    mode: "Online",
    status: "Upcoming",
    startDate: "2026-11-01",
    endDate: "2026-11-03"
};

const renderCard = (data = hackathon) => {
    return render(
        <MemoryRouter>
            <HackathonCard hackathon={data} />
        </MemoryRouter>
    );
};

describe("HackathonCard", () => {
    test("renders title, organizer, and status", () => {
        renderCard();

        expect(screen.getByText("Geek Hack 2026")).toBeInTheDocument();
        expect(screen.getByText("Geektoberfest")).toBeInTheDocument();
        expect(screen.getByText("Upcoming")).toBeInTheDocument();
    });

    test("links to hackathon details", () => {
        renderCard();

        expect(screen.getByText("View details")).toHaveAttribute("href", "/hackathons/abc123");
    });

    test("shows TBA for missing dates", () => {
        renderCard({ ...hackathon, startDate: null, endDate: null });

        expect(screen.getByText(/TBA/)).toBeInTheDocument();
    });

    test("shows Dates TBA when both dates are missing", () => {
        renderCard({ ...hackathon, startDate: null, endDate: null });

        expect(screen.getByText(/Dates TBA/)).toBeInTheDocument();
    });

    test("shows one-sided dates gracefully", () => {
        const { unmount } = renderCard({ ...hackathon, endDate: null });
        expect(screen.getByText(/Starts /)).toBeInTheDocument();
        unmount();

        renderCard({ ...hackathon, startDate: null });
        expect(screen.getByText(/Ends /)).toBeInTheDocument();
    });

    test("collapses a single-day event to one date", () => {
        renderCard({ ...hackathon, startDate: "2026-11-01", endDate: "2026-11-01" });

        expect(screen.queryByText(/ to /)).not.toBeInTheDocument();
    });
});
