import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HackathonForm from "../components/HackathonForm";

describe("HackathonForm", () => {
    test("submits form values", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue({});
        render(<HackathonForm onSubmit={onSubmit} buttonText="Create" />);

        await user.type(screen.getByLabelText(/title/i), "Geek Hack");
        await user.type(screen.getByLabelText(/organizer/i), "Geektoberfest");
        await user.click(screen.getByRole("button", { name: /create/i }));

        expect(onSubmit).toHaveBeenCalledOnce();
        expect(onSubmit.mock.calls[0][0]).toMatchObject({
            title: "Geek Hack",
            organizer: "Geektoberfest"
        });
    });

    test("shows server error message", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockRejectedValue({
            response: { data: { message: "Title is required" } }
        });
        render(<HackathonForm onSubmit={onSubmit} buttonText="Create" />);

        await user.type(screen.getByLabelText(/title/i), "x");
        await user.type(screen.getByLabelText(/organizer/i), "y");
        await user.click(screen.getByRole("button", { name: /create/i }));

        expect(await screen.findByText("Title is required")).toBeInTheDocument();
    });
});
