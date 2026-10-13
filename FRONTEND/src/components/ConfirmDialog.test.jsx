import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "../components/ConfirmDialog";

const props = {
    title: "Delete hackathon?",
    message: 'Delete "Geek Hack"? This cannot be undone.',
    confirmLabel: "Delete hackathon",
    onConfirm: vi.fn(),
    onCancel: vi.fn()
};

const renderDialog = (overrides = {}) => {
    return render(<ConfirmDialog {...props} {...overrides} />);
};

describe("ConfirmDialog", () => {
    test("renders title and message as an alert dialog", () => {
        renderDialog();

        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toBeInTheDocument();
        expect(screen.getByText("Delete hackathon?")).toBeInTheDocument();
        expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    });

    test("confirms deletion", async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        renderDialog({ onConfirm });

        await user.click(screen.getByRole("button", { name: "Delete hackathon" }));

        expect(onConfirm).toHaveBeenCalledOnce();
    });

    test("cancels deletion", async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        renderDialog({ onCancel });

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalledOnce();
    });

    test("cancels on Escape", async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        renderDialog({ onCancel });

        await user.keyboard("{Escape}");

        expect(onCancel).toHaveBeenCalledOnce();
    });

    test("disables buttons while confirming", () => {
        renderDialog({ confirming: true });

        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
    });
});
