/* eslint-disable react-refresh/only-export-components -- test helpers, not app components */
import { LinkProvider } from "@cloudflare/kumo";
import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "./app/AppLayout";
import {
  AuthContext,
  type AuthContextValue,
} from "./contexts/AuthContext";
import { CurrentLanguageProvider } from "./contexts/CurrentLanguageContext";
import { KumoRouterLink } from "./app/KumoLinkAdapter";

const STORAGE_KEY = "language-practice:current-language";

const defaultAuthValue: AuthContextValue = {
  user: null,
  isLoading: false,
  signIn: async () => {},
  signOut: async () => {},
};

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={defaultAuthValue}>
      {children}
    </AuthContext.Provider>
  );
}

export type AuthOverrides = Partial<AuthContextValue>;

function AuthOverrideProvider({
  overrides,
  children,
}: {
  overrides: AuthOverrides;
  children: React.ReactNode;
}) {
  const value: AuthContextValue = {
    ...defaultAuthValue,
    ...overrides,
  };
  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <LinkProvider component={KumoRouterLink}>
      <MemoryRouter initialEntries={["/"]}>
        <CurrentLanguageProvider>
          <MockAuthProvider>{children}</MockAuthProvider>
        </CurrentLanguageProvider>
      </MemoryRouter>
    </LinkProvider>
  );
}

/**
 * Renders a component with app providers (router, language, mock auth).
 * Use for components that need useNavigate, useCurrentLanguage, or useAuth.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: AllProviders,
    ...options,
  });
}

const appLayoutRoutes = (
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<div data-testid="outlet" />} />
      <Route
        path="words"
        element={<div data-testid="words-page">Words page</div>}
      />
    </Route>
  </Routes>
);

/**
 * Renders AppLayout with a minimal outlet so nav and layout render correctly.
 * Use for tests that target the layout (e.g. language selector, nav).
 */
function renderAppLayout() {
  return customRender(appLayoutRoutes);
}

/**
 * Renders AppLayout with overridable auth (user, isLoading, signIn, signOut).
 * Use for tests that need to assert logged-in vs logged-out UI or auth flows.
 */
function renderAppLayoutWithAuth(overrides: AuthOverrides = {}) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <LinkProvider component={KumoRouterLink}>
      <MemoryRouter initialEntries={["/"]}>
        <CurrentLanguageProvider>
          <AuthOverrideProvider overrides={overrides}>
            {children}
          </AuthOverrideProvider>
        </CurrentLanguageProvider>
      </MemoryRouter>
    </LinkProvider>
  );
  return render(appLayoutRoutes, { wrapper });
}

export { customRender, renderAppLayout, renderAppLayoutWithAuth, STORAGE_KEY };
export { screen } from "@testing-library/react";
