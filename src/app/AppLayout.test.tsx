/**
 * @vitest-environment jsdom
 */
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Doc } from "../../convex/_generated/dataModel";
import type { Id } from "../../convex/_generated/dataModel";
import {
  renderAppLayout,
  renderAppLayoutWithAuth,
  screen,
  STORAGE_KEY,
} from "../test-utils";

const MD_BREAKPOINT = "(min-width: 768px)";

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

  describe("navigation", () => {
    let mdMatches: boolean;
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      window.matchMedia = (query: string) => ({
        get matches() {
          return query === MD_BREAKPOINT ? mdMatches : false;
        },
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
        onchange: null,
        media: query,
      });
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    describe("hamburger menu (small viewport)", () => {
      it("opens menu and navigates to Words page when Words is clicked", async () => {
        mdMatches = false;
        renderAppLayout();

        const openMenuButton = screen.getByRole("button", {
          name: "Open menu",
        });
        await user.click(openMenuButton);

        const wordsItem = await screen.findByText("Words");
        expect(wordsItem).toBeInTheDocument();
        await user.click(wordsItem);

        expect(screen.getByTestId("words-page")).toBeInTheDocument();
      });
    });

    describe("nav bar (large viewport)", () => {
      it("navigates to Words page when Words link is clicked", async () => {
        mdMatches = true;
        renderAppLayout();

        const wordsLink = screen.getByRole("link", { name: "Words" });
        await user.click(wordsLink);

        expect(screen.getByTestId("words-page")).toBeInTheDocument();
      });
    });
  });

  describe("login and logout", () => {
    const mockUserWithEmail = {
      _id: "mock-user-id" as Id<"users">,
      email: "user@example.com",
      name: "Test User",
    } as Doc<"users">;

    const mockUserNameOnly = {
      _id: "mock-user-id-2" as Id<"users">,
      name: "Display Name",
    } as Doc<"users">;

    const mockUserNeither = {
      _id: "mock-user-id-3" as Id<"users">,
    } as Doc<"users">;

    describe("AppHeader: logged-in vs logged-out", () => {
      it("shows Log in button when logged out", () => {
        renderAppLayoutWithAuth({ user: null });

        expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Account" })).not.toBeInTheDocument();
      });

      it("shows Account button when logged in", () => {
        renderAppLayoutWithAuth({ user: mockUserWithEmail });

        expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Log in" })).not.toBeInTheDocument();
      });

      it("shows neither Log in nor Account when loading", () => {
        renderAppLayoutWithAuth({ isLoading: true });

        expect(screen.queryByRole("button", { name: "Log in" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Account" })).not.toBeInTheDocument();
      });
    });

    describe("User icon popover content", () => {
      it("shows email and Log out when user has email", async () => {
        renderAppLayoutWithAuth({ user: mockUserWithEmail });

        await user.click(screen.getByRole("button", { name: "Account" }));

        expect(await screen.findByText("user@example.com")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
      });

      it("shows name and Log out when user has name but no email", async () => {
        renderAppLayoutWithAuth({ user: mockUserNameOnly });

        await user.click(screen.getByRole("button", { name: "Account" }));

        expect(await screen.findByText("Display Name")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
      });

      it(
        "shows Signed in and Log out when user has neither email nor name",
        async () => {
          renderAppLayoutWithAuth({ user: mockUserNeither });

          await user.click(screen.getByRole("button", { name: "Account" }));

          expect(await screen.findByText("Signed in")).toBeInTheDocument();
          expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
        },
      );
    });
  });
});
