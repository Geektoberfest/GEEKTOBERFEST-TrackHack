import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Teams from "../pages/Teams";
import api from "../api";

vi.mock("../api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn()
    }
}));

const teams = [{ _id: "t1", name: "Byte Squad", memberCount: 3, myRole: "owner" }];
const invites = [{ _id: "i1", team: { _id: "t2", name: "Null Pointers" }, invitedBy: { name: "Ada" } }];

const renderTeams = () =>
    render(
        <MemoryRouter>
            <Teams />
        </MemoryRouter>
    );

describe("Teams page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.get.mockImplementation((url) => {
            if (url === "/teams/invites") {
                return Promise.resolve({ data: { invites: [] } });
            }
            return Promise.resolve({ data: { teams: [] } });
        });
    });

    test("lists the user's teams with their role", async () => {
        api.get.mockImplementation((url) =>
            Promise.resolve({ data: url === "/teams" ? { teams } : { invites: [] } })
        );
        renderTeams();

        expect(await screen.findByText("Byte Squad")).toBeInTheDocument();
        expect(screen.getByText(/you are owner/)).toBeInTheDocument();
    });

    test("accepting an invite calls the accept endpoint and reloads", async () => {
        const user = userEvent.setup();
        let inviteList = invites;
        api.get.mockImplementation((url) =>
            Promise.resolve({ data: url === "/teams" ? { teams: [] } : { invites: inviteList } })
        );
        api.post.mockImplementation(() => {
            inviteList = [];
            return Promise.resolve({ data: { success: true } });
        });
        renderTeams();

        await screen.findByText("Null Pointers");
        await user.click(screen.getByRole("button", { name: "Accept" }));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith("/teams/invites/i1/accept");
        });
        await waitFor(() => {
            expect(screen.queryByText("Null Pointers")).not.toBeInTheDocument();
        });
    });

    test("declining an invite calls the decline endpoint", async () => {
        const user = userEvent.setup();
        api.get.mockImplementation((url) =>
            Promise.resolve({ data: url === "/teams" ? { teams: [] } : { invites } })
        );
        api.post.mockResolvedValue({ data: { success: true } });
        renderTeams();

        await screen.findByText("Null Pointers");
        await user.click(screen.getByRole("button", { name: "Decline" }));

        expect(api.post).toHaveBeenCalledWith("/teams/invites/i1/decline");
    });

    test("creates a team from the form", async () => {
        const user = userEvent.setup();
        api.post.mockResolvedValue({ data: { success: true } });
        renderTeams();

        await user.type(await screen.findByLabelText("Team name"), "Fresh Team");
        await user.click(screen.getByRole("button", { name: "Create team" }));

        expect(api.post).toHaveBeenCalledWith("/teams", { name: "Fresh Team" });
    });
});
