// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createTranslator } from "./translation";

const mockInstance = vi.fn();

vi.mock("translate", () => ({
    Translate: vi.fn(() => mockInstance),
    default: vi.fn(),
}));

describe("translation.createTranslator", () => {
    it("returns same text when fromLang === toLang", async () => {
        const translateFn = createTranslator({
            url: "https://example.com",
            apiKey: "test-key",
        });
        const result = await translateFn("hello", "en", "en");
        expect(result).toBe("hello");
        expect(mockInstance).not.toHaveBeenCalled();
    });

    it("returns same text when text is empty after trim", async () => {
        const translateFn = createTranslator({
            url: "https://example.com",
            apiKey: "test-key",
        });
        const result = await translateFn("   ", "en", "fr");
        expect(result).toBe("   ");
        expect(mockInstance).not.toHaveBeenCalled();
    });

    it("returns same text when text is empty string", async () => {
        const translateFn = createTranslator({
            url: "https://example.com",
            apiKey: "test-key",
        });
        const result = await translateFn("", "en", "fr");
        expect(result).toBe("");
        expect(mockInstance).not.toHaveBeenCalled();
    });

    it("calls translator when from !== to and text non-empty", async () => {
        mockInstance.mockResolvedValueOnce("hello");
        const translateFn = createTranslator({
            url: "https://example.com",
            apiKey: "test-key",
        });
        const result = await translateFn("bonjour", "fr", "en");
        expect(result).toBe("hello");
        expect(mockInstance).toHaveBeenCalledTimes(1);
        expect(mockInstance).toHaveBeenCalledWith("bonjour", {
            from: "fr",
            to: "en",
        });
    });
});
