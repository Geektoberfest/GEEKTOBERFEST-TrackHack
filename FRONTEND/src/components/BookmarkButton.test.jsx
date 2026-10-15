import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookmarkButton from "./BookmarkButton";

const mockUseBookmarks = vi.hoisted(() => vi.fn());
vi.mock("../context/BookmarkContext", () => ({
    useBookmarks: () => mockUseBookmarks()
}));

const setup = (overrides = {}) => {
    mockUseBookmarks.mockReturnValue({
        isSaved: () => false,
        toggleSaved: vi.fn().mockResolvedValue(null),
        ...overrides
    });
};

describe("BookmarkButton", () => {
    beforeEach(() => {
        mockUseBookmarks.mockReset();
    });

    test("shows Save when the hackathon is not saved", () => {
        setup();
        render(<BookmarkButton hackathonId="h1" />);

        expect(screen.getByRole("button", { name: /save hackathon/i })).toHaveAttribute("aria-pressed", "false");
    });

    test("shows Saved when the hackathon is saved", () => {
        setup({ isSaved: (id) => id === "h1" });
        render(<BookmarkButton hackathonId="h1" />);

        expect(screen.getByRole("button", { name: /remove from saved/i })).toHaveAttribute("aria-pressed", "true");
    });

    test("click toggles and calls onChange", async () => {
        const user = userEvent.setup();
        const toggleSaved = vi.fn().mockResolvedValue(null);
        const onChange = vi.fn();
        setup({ toggleSaved });
        render(<BookmarkButton hackathonId="h1" onChange={onChange} />);

        await user.click(screen.getByRole("button", { name: /save hackathon/i }));

        expect(toggleSaved).toHaveBeenCalledWith("h1");
        await waitFor(() => expect(onChange).toHaveBeenCalledWith("h1"));
    });

    test("shows the error message when saving fails", async () => {
        const user = userEvent.setup();
        setup({ toggleSaved: vi.fn().mockResolvedValue("Hackathon not found") });
        render(<BookmarkButton hackathonId="h1" />);

        await user.click(screen.getByRole("button", { name: /save hackathon/i }));

        expect(await screen.findByText("Hackathon not found")).toBeInTheDocument();
    });
});
