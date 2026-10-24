import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Analytics from "../pages/Analytics";
import api from "../api";
import * as AuthContext from "../context/AuthContext";

vi.mock("../api", () => ({
    default: {
        get: vi.fn()
    }
}));

const statusCounts = [
    { status: "Upcoming", count: 2 },
    { status: "Registered", count: 0 },
    { status: "In Progress", count: 1 },
    { status: "Completed", count: 1 },
    { status: "Cancelled", count: 0 }
];

const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: "2026-" + String(index + 1).padStart(2, "0"),
    count: index === 9 ? 4 : 0
}));

const populated = {
    success: true,
    scope: "me",
    totals: { tracked: 4, successful: 3, successRate: 75 },
    statusCounts,
    monthly
};

const empty = {
    success: true,
    scope: "me",
    totals: { tracked: 0, successful: 0, successRate: null },
    statusCounts: statusCounts.map((item) => ({ ...item, count: 0 })),
    monthly: monthly.map((item) => ({ ...item, count: 0 }))
};

const renderAnalytics = (role = "user") => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        user: { id: "u1", name: "Ada", role },
        isAdmin: role === "admin",
        saveLogin: vi.fn(),
        logout: vi.fn()
    });

    return render(
        <MemoryRouter>
            <Analytics />
        </MemoryRouter>
    );
};

describe("Analytics page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("shows stat cards, the monthly chart and the status breakdown", async () => {
        api.get.mockResolvedValue({ data: populated });
        renderAnalytics();

        expect(await screen.findByText("75%")).toBeInTheDocument();
        expect(screen.getByText("Tracked")).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Hackathons tracked per month" })).toBeInTheDocument();
        expect(screen.getByText("Upcoming")).toBeInTheDocument();
        expect(screen.getByText("2 (50%)")).toBeInTheDocument();
    });

    test("shows an empty state when nothing is tracked", async () => {
        api.get.mockResolvedValue({ data: empty });
        renderAnalytics();

        expect(await screen.findByText("No analytics yet")).toBeInTheDocument();
        expect(screen.queryByRole("img", { name: "Hackathons tracked per month" })).not.toBeInTheDocument();
    });

    test("admins can switch on all users and the request asks for it", async () => {
        const user = userEvent.setup();
        api.get.mockResolvedValue({ data: populated });
        renderAnalytics("admin");

        await screen.findByText("75%");
        await user.click(screen.getByLabelText("Include all users"));

        await waitFor(() => {
            expect(api.get).toHaveBeenLastCalledWith("/analytics/me", { params: { all: "true" } });
        });
    });

    test("non-admins do not see the all-users toggle", async () => {
        api.get.mockResolvedValue({ data: populated });
        renderAnalytics("user");

        await screen.findByText("75%");
        expect(screen.queryByLabelText("Include all users")).not.toBeInTheDocument();
    });
});
