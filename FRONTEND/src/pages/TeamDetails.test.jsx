import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TeamDetails from "../pages/TeamDetails";
import api from "../api";
import * as AuthContext from "../context/AuthContext";

vi.mock("../api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn()
    }
}));

const members = [
    { _id: "m1", role: "owner", user: { _id: "u1", name: "Ada", email: "ada@example.com" } },
    { _id: "m2", role: "member", user: { _id: "u2", name: "Bob", email: "bob@example.com" } }
];

const renderTeam = (myRole) => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        user: { id: "u1", name: "Ada", role: "user" },
        isAdmin: false,
        saveLogin: vi.fn(),
        logout: vi.fn()
    });
    api.get.mockResolvedValue({
        data: { team: { _id: "t1", name: "Byte Squad", members }, myRole, invites: [] }
    });

    return render(
        <MemoryRouter initialEntries={["/teams/t1"]}>
            <Routes>
                <Route path="/teams/:id" element={<TeamDetails />} />
                <Route path="/teams" element={<p>Teams page</p>} />
            </Routes>
        </MemoryRouter>
    );
};

describe("TeamDetails roles", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("owners get a role dropdown for each member", async () => {
        renderTeam("owner");

        expect(await screen.findByText("Byte Squad")).toBeInTheDocument();
        expect(screen.getByLabelText("Role for Bob")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    });

    test("plain members see roles as text and no invite form", async () => {
        renderTeam("member");

        expect(await screen.findByText("Byte Squad")).toBeInTheDocument();
        expect(screen.queryByLabelText("Role for Bob")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Member email")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    });
});
