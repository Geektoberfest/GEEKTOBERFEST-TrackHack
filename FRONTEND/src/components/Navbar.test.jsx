import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";
import * as AuthContext from "../context/AuthContext";

const renderNavbar = (user) => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        user,
        isAdmin: user?.role === "admin",
        saveLogin: vi.fn(),
        logout: vi.fn()
    });

    return render(
        <MemoryRouter>
            <Navbar />
        </MemoryRouter>
    );
};

describe("Navbar", () => {
    test("shows Admin link for admins", () => {
        renderNavbar({ name: "Ada", role: "admin" });

        expect(screen.getByText("Admin")).toHaveAttribute("href", "/admin");
    });

    test("hides Admin link for regular users", () => {
        renderNavbar({ name: "Bob", role: "user" });

        expect(screen.queryByText("Admin")).not.toBeInTheDocument();
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    test("shows login and register when anonymous", () => {
        renderNavbar(null);

        expect(screen.getByText("Login")).toBeInTheDocument();
        expect(screen.getByText("Register")).toBeInTheDocument();
    });
});
