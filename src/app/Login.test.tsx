/**
 * @vitest-environment jsdom
 */
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Doc } from "../../convex/_generated/dataModel";
import type { Id } from "../../convex/_generated/dataModel";
import {
  renderAppLayoutWithAuth,
  screen,
  STORAGE_KEY,
} from "../test-utils";

describe("Login", () => {
  let user: ReturnType<typeof userEvent.setup>;

  const mockUserWithEmail = {
    _id: "mock-user-id" as Id<"users">,
    email: "user@example.com",
    name: "Test User",
  } as Doc<"users">;

  beforeEach(() => {
    cleanup();
    sessionStorage.removeItem(STORAGE_KEY);
    user = userEvent.setup();
  });

  describe("LoginModal content", () => {
    it("opens dialog with sign-in step content when Log in is clicked", async () => {
      renderAppLayoutWithAuth({ user: null });

      await user.click(screen.getByRole("button", { name: "Log in" }));

      expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
      expect(
        screen.getByText("Enter your email and password to sign in."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign up instead" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });
  });

  describe("Sign-up flow", () => {
    it("shows sign-up step when Sign up instead is clicked", async () => {
      renderAppLayoutWithAuth({ user: null });

      await user.click(screen.getByRole("button", { name: "Log in" }));
      await user.click(
        await screen.findByRole("button", { name: "Sign up instead" }),
      );

      expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
      expect(
        screen.getByText("Create an account with your email and password."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign in instead" })).toBeInTheDocument();
    });

    it("calls signIn with password and signUp flow and closes modal on submit", async () => {
      const signIn = vi.fn().mockResolvedValue(undefined);
      renderAppLayoutWithAuth({ user: null, signIn });

      await user.click(screen.getByRole("button", { name: "Log in" }));
      await user.click(
        await screen.findByRole("button", { name: "Sign up instead" }),
      );

      await user.type(screen.getByLabelText("Email"), "new@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign up" }));

      expect(signIn).toHaveBeenCalledTimes(1);
      expect(signIn).toHaveBeenCalledWith("password", expect.any(FormData));
      const formData = signIn.mock.calls[0][1] as FormData;
      expect(formData.get("flow")).toBe("signUp");

      expect(screen.queryByRole("heading", { name: "Sign up" })).not.toBeInTheDocument();
    });
  });

  describe("Login flow", () => {
    it("closes modal when sign-in succeeds", async () => {
      const signIn = vi.fn().mockResolvedValue(undefined);
      renderAppLayoutWithAuth({ user: null, signIn });

      await user.click(screen.getByRole("button", { name: "Log in" }));
      await user.type(screen.getByLabelText("Email"), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      expect(screen.queryByRole("heading", { name: "Sign in" })).not.toBeInTheDocument();
    });

    it("shows error and keeps modal open when sign-in fails", async () => {
      const signIn = vi.fn().mockRejectedValue(new Error("Invalid"));
      renderAppLayoutWithAuth({ user: null, signIn });

      await user.click(screen.getByRole("button", { name: "Log in" }));
      await user.type(screen.getByLabelText("Email"), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "wrong");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      const errorMessage = await screen.findByText("Invalid email or password");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute("role", "alert");
      expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    });
  });

  describe("Logout flow", () => {
    it("calls signOut when Log out is clicked", async () => {
      const signOut = vi.fn().mockResolvedValue(undefined);
      renderAppLayoutWithAuth({
        user: mockUserWithEmail,
        signOut,
      });

      await user.click(screen.getByRole("button", { name: "Account" }));
      await user.click(
        await screen.findByRole("button", { name: "Log out" }),
      );

      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });
});
