import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "../components/StatusBadge";

describe("StatusBadge", () => {
    test("renders status text", () => {
        render(<StatusBadge status="Upcoming" />);

        expect(screen.getByText("Upcoming")).toBeInTheDocument();
    });

    test("applies color class per status", () => {
        const { rerender } = render(<StatusBadge status="Completed" />);
        expect(screen.getByText("Completed").className).toMatch(/green/);

        rerender(<StatusBadge status="Cancelled" />);
        expect(screen.getByText("Cancelled").className).toMatch(/red/);
    });
});
