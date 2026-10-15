import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import HackathonDetails from "../pages/HackathonDetails";
import api from "../api";
import * as AuthContext from "../context/AuthContext";

// the details page renders a bookmark button; stub the saved list so these tests stay focused on delete
vi.mock("../context/BookmarkContext", () => ({
    useBookmarks: () => ({ isSaved: () => false, toggleSaved: async () => null })
}));

vi.mock("../api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
    }
}));

const hackathon = {
    _id: "h1",
    title: "Geek Hack 2026",
    organizer: "Geektoberfest",
    mode: "Online",
    status: "Upcoming",
    createdBy: { _id: "u1", name: "Ada" }
};

const renderDetails = () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        user: { id: "u1", name: "Ada", role: "user" },
        isAdmin: false,
        saveLogin: vi.fn(),
        logout: vi.fn()
    });

    return render(
        <MemoryRouter initialEntries={["/hackathons/h1"]}>
            <Routes>
                <Route path="/hackathons/:id" element={<HackathonDetails />} />
                <Route path="/dashboard" element={<p>Dashboard page</p>} />
            </Routes>
        </MemoryRouter>
    );
};

describe("HackathonDetails delete confirmation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.get.mockImplementation((url) => {
            if (url.startsWith("/trackers")) {
                return Promise.resolve({ data: { trackers: [] } });
            }
            return Promise.resolve({ data: { hackathon } });
        });
    });

    test("opens a confirmation dialog without deleting", async () => {
        const user = userEvent.setup();
        renderDetails();

        await screen.findByText("Geek Hack 2026");
        await user.click(screen.getByRole("button", { name: "Delete" }));

        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        expect(api.delete).not.toHaveBeenCalled();
    });

    test("cancel leaves the hackathon untouched", async () => {
        const user = userEvent.setup();
        renderDetails();

        await screen.findByText("Geek Hack 2026");
        await user.click(screen.getByRole("button", { name: "Delete" }));
        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(api.delete).not.toHaveBeenCalled();
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    test("confirm deletes and navigates to dashboard", async () => {
        const user = userEvent.setup();
        api.delete.mockResolvedValue({ data: { success: true } });
        renderDetails();

        await screen.findByText("Geek Hack 2026");
        await user.click(screen.getByRole("button", { name: "Delete" }));
        await user.click(screen.getByRole("button", { name: "Delete hackathon" }));

        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith("/hackathons/h1");
        });
        expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
    });
});
