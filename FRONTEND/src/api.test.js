import { describe, test, expect, vi, beforeEach } from "vitest";
import api from "./api";

describe("api client", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    test("adds bearer token from localStorage", async () => {
        localStorage.setItem("token", "test-token");

        const handler = api.interceptors.request.handlers[0];
        const config = await handler.fulfilled({ headers: {} });

        expect(config.headers.Authorization).toBe("Bearer test-token");
    });

    test("leaves headers untouched without token", async () => {
        const handler = api.interceptors.request.handlers[0];
        const config = await handler.fulfilled({ headers: {} });

        expect(config.headers.Authorization).toBeUndefined();
    });
});
