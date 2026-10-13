import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar, { trackerSteps } from "../components/ProgressBar";

describe("ProgressBar", () => {
    test("shows 0% for empty tracker", () => {
        render(<ProgressBar tracker={{}} />);

        expect(screen.getByText("0 of 7 steps")).toBeInTheDocument();
        expect(screen.getByText("0%")).toBeInTheDocument();
    });

    test("computes progress from completed steps", () => {
        const tracker = {
            ideaSubmitted: true,
            teamFormed: true,
            prototypeStarted: true
        };
        render(<ProgressBar tracker={tracker} />);

        expect(screen.getByText("3 of 7 steps")).toBeInTheDocument();
        expect(screen.getByText("43%")).toBeInTheDocument();
    });

    test("exposes seven tracker steps", () => {
        expect(trackerSteps).toHaveLength(7);
    });
});
