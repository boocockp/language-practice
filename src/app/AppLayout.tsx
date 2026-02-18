import { Button, Select } from "@cloudflare/kumo";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import { LoginModal } from "../features/auth/LoginModal";
import { cn } from "../lib/cn";
import { getLanguageName, LANGUAGES } from "../lib/languages";

const navItems = [
  { to: "/", label: "Home", end: true as const },
  { to: "/practice", label: "Practice" },
  { to: "/words", label: "Words" },
  { to: "/question-types", label: "Question Types" },
  { to: "/stats", label: "Stats" },
  { to: "/settings", label: "Settings" },
];

export function AppLayout() {
  const { language, setLanguage } = useCurrentLanguage();
  const { user, isLoading, signOut } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3"
        >
          <ul className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <Select
              label="Current language"
              hideLabel
              value={language}
              onValueChange={(v) => setLanguage((v as string) ?? "en")}
              renderValue={(v) => getLanguageName(v as string)}
              className="w-[140px]"
            >
              {LANGUAGES.map(({ code, name }) => (
                <Select.Option key={code} value={code}>
                  {name}
                </Select.Option>
              ))}
            </Select>
            {!isLoading && (
              <>
                {user ? (
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-slate-600" aria-label="Signed in as">
                      {user.email ?? user.name ?? "Signed in"}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void signOut()}
                    >
                      Log out
                    </Button>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setLoginModalOpen(true)}
                  >
                    Log in
                  </Button>
                )}
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}

