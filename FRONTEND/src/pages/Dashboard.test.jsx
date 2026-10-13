import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import api from "../api";

vi.mock("../api", () => ({
    default: {
        get: vi.fn()
    }
}));

const trackers = [
    {
        _id: "t1",
        ideaSubmitted: true,
        hackathon: { _id: "h1", title: "Geek Hack 2026" }
    }
];

const mockApi = (trackerList) => {
    api.get.mockImplementation((url) => {
        if (url.startsWith("/trackers")) {
            return Promise.resolve({ data: { trackers: trackerList } });
        }
        return Promise.resolve({ data: { hackathons: [] } });
    });
};

const renderDashboard = () => {
    return render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );
};

describe("Dashboard CSV export", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        URL.createObjectURL = vi.fn().mockReturnValue("blob:fake");
        URL.revokeObjectURL = vi.fn();
    });

    test("export button is disabled without trackers", async () => {
        mockApi([]);
        renderDashboard();

        expect(await screen.findByRole("button", { name: "Export CSV" })).toBeDisabled();
    });

    test("export button downloads a CSV of trackers", async () => {
        const user = userEvent.setup();
        mockApi(trackers);
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(() => {});
        renderDashboard();

        const button = await screen.findByRole("button", { name: "Export CSV" });
        expect(button).toBeEnabled();

        await user.click(button);

        expect(URL.createObjectURL).toHaveBeenCalledOnce();
        expect(click).toHaveBeenCalledOnce();
        expect(click.mock.instances[0].download).toMatch(/^trackhack-trackers-.*\.csv$/);
    });
});
