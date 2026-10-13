import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Admin from "../pages/Admin";
import api from "../api";
import * as AuthContext from "../context/AuthContext";

vi.mock("../api", () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn()
    }
}));

const users = [
    { _id: "u1", name: "Ada", email: "ada@example.com", role: "admin" },
    { _id: "u2", name: "Bob", email: "bob@example.com", role: "user" }
];

const renderAdmin = () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        user: { id: "u1", name: "Ada", role: "admin" },
        isAdmin: true,
        saveLogin: vi.fn(),
        logout: vi.fn()
    });

    return render(
        <MemoryRouter>
            <Admin />
        </MemoryRouter>
    );
};

describe("Admin page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.get.mockResolvedValue({ data: { users } });
    });

    test("renders the user list", async () => {
        renderAdmin();

        expect(screen.getByText("Loading users...")).toBeInTheDocument();
        expect(await screen.findByText("bob@example.com")).toBeInTheDocument();
        expect(api.get).toHaveBeenCalledWith("/admin/users");
    });

    test("shows empty state when there are no users", async () => {
        api.get.mockResolvedValue({ data: { users: [] } });
        renderAdmin();

        expect(await screen.findByText("No users found.")).toBeInTheDocument();
    });

    test("shows an error when loading fails", async () => {
        api.get.mockRejectedValue({ response: { data: { message: "Forbidden" } } });
        renderAdmin();

        expect(await screen.findByText("Forbidden")).toBeInTheDocument();
    });

    test("changes a user's role", async () => {
        const user = userEvent.setup();
        api.patch.mockResolvedValue({ data: { user: { ...users[1], role: "admin" } } });
        renderAdmin();

        await screen.findByText("bob@example.com");
        await user.selectOptions(screen.getByLabelText("Role for bob@example.com"), "admin");

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith("/admin/users/u2/role", { role: "admin" });
        });
        expect(await screen.findByText("Role updated for bob@example.com")).toBeInTheDocument();
    });

    test("deletes a user after confirmation", async () => {
        const user = userEvent.setup();
        window.confirm = vi.fn().mockReturnValue(true);
        api.delete.mockResolvedValue({ data: { success: true } });
        renderAdmin();

        await screen.findByText("bob@example.com");
        await user.click(screen.getAllByRole("button", { name: "Delete" })[1]);

        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith("/admin/users/u2");
        });
        expect(await screen.findByText("Deleted bob@example.com")).toBeInTheDocument();
    });

    test("does not delete when confirmation is dismissed", async () => {
        const user = userEvent.setup();
        window.confirm = vi.fn().mockReturnValue(false);
        renderAdmin();

        await screen.findByText("bob@example.com");
        await user.click(screen.getAllByRole("button", { name: "Delete" })[1]);

        expect(api.delete).not.toHaveBeenCalled();
    });
});
