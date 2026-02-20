/**
 * @vitest-environment jsdom
 */
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { renderAppLayout, screen, STORAGE_KEY } from "../test-utils";

describe("AppLayout", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    cleanup();
    sessionStorage.removeItem(STORAGE_KEY);
    user = userEvent.setup();
  });

  describe("language selector", () => {
    it("shows current language and flag in the button", () => {
      renderAppLayout();

      const button = screen.getByRole("button", { name: "Current language" });
      expect(button).toHaveTextContent("en");
      expect(button).toHaveTextContent("🇬🇧");
    });

    it("opens menu and shows language options", async () => {
      renderAppLayout();

      const button = screen.getByRole("button", { name: "Current language" });
      await user.click(button);

      expect(await screen.findByText("Français")).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it("updates button and sessionStorage when language is changed", async () => {
      renderAppLayout();

      const button = screen.getByRole("button", { name: "Current language" });
      await user.click(button);
      const frenchOption = await screen.findByText("Français");
      await user.click(frenchOption);

      expect(button).toHaveTextContent("fr");
      expect(button).toHaveTextContent("🇫🇷");
      expect(sessionStorage.getItem(STORAGE_KEY)).toBe("fr");
    });

    it("persists selected language across re-render", async () => {
      const { unmount } = renderAppLayout();

      const button = screen.getByRole("button", { name: "Current language" });
      await user.click(button);
      const frenchOption = await screen.findByText("Français");
      await user.click(frenchOption);

      expect(button).toHaveTextContent("fr");
      expect(button).toHaveTextContent("🇫🇷");

      unmount();
      renderAppLayout();

      const buttonAfterRemount = screen.getByRole("button", {
        name: "Current language",
      });
      expect(buttonAfterRemount).toHaveTextContent("fr");
      expect(buttonAfterRemount).toHaveTextContent("🇫🇷");
    });
  });
});
