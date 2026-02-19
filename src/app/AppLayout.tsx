import { Button, DropdownMenu, Popover } from "@cloudflare/kumo";
import { List, X, CaretDown, UserCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import { LoginModal } from "../features/auth/LoginModal";
import { cn } from "../lib/cn";
import { getLanguageFlag, LANGUAGES } from "../lib/languages";

const navItems = [
  { to: "/", label: "Home", end: true as const },
  { to: "/practice", label: "Practice" },
  { to: "/words", label: "Words" },
  { to: "/question-types", label: "Question Types" },
  { to: "/stats", label: "Stats" },
  { to: "/settings", label: "Settings" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { language, setLanguage } = useCurrentLanguage();
  const { user, isLoading, signOut } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="border-b border-slate-200 pt-safe">
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2"
        >
          {/* Nav: hamburger below md, full list from md */}
          <div className="flex items-center gap-2">
            <DropdownMenu
              open={navMenuOpen}
              onOpenChange={(open) => setNavMenuOpen(open)}
            >
              <DropdownMenu.Trigger>
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={navMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={navMenuOpen}
                  className="min-h-7 min-w-7 flex items-center justify-center border-0 p-0 !shadow-none !ring-0 md:hidden"
                >
                  {navMenuOpen ? (
                    <X className="size-6 shrink-0" aria-hidden />
                  ) : (
                    <List className="size-6 shrink-0" aria-hidden />
                  )}
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {navItems.map((item) => (
                  <DropdownMenu.Item
                    key={item.to}
                    onClick={() => {
                      navigate(item.to);
                      setNavMenuOpen(false);
                    }}
                    className="min-h-7"
                  >
                    {item.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu>
            <ul className="hidden flex-wrap gap-2 md:flex">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "rounded-md px-3 py-1 text-sm font-medium transition-colors min-h-7 min-w-7 inline-flex items-center justify-center",
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
          </div>

          <div className="flex items-center gap-3">
            {/* Language: compact button + dropdown at all sizes */}
            <DropdownMenu>
              <DropdownMenu.Trigger>
                <Button
                  type="button"
                  variant="secondary"
                  aria-label="Current language"
                  className="min-h-7 shrink-0 gap-1.5 text-base uppercase"
                >
                  <span aria-hidden>
                    {getLanguageFlag(language)} {language}
                  </span>
                  <CaretDown className="size-4 shrink-0" aria-hidden />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {LANGUAGES.map(({ code, name }) => (
                  <DropdownMenu.Item
                    key={code}
                    onClick={() => setLanguage(code)}
                    className="min-h-7"
                  >
                    {name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu>

            {/* User: icon + popover when logged in, Log in button when not */}
            {!isLoading && (
              <>
                {user ? (
                  <Popover>
                    <Popover.Trigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        aria-label="Account"
                        className="min-h-7 min-w-7 flex items-center justify-center border-0 p-0 !shadow-none !ring-0"
                      >
                        <UserCircle className="size-6 shrink-0" aria-hidden />
                      </Button>
                    </Popover.Trigger>
                    <Popover.Content side="bottom" align="end">
                      <div className="flex flex-col gap-3 p-2">
                        <p
                          className="text-sm text-slate-600"
                          id="account-description"
                        >
                          {user.email ?? user.name ?? "Signed in"}
                        </p>
                        <Popover.Close asChild>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => void signOut()}
                            className="min-h-7"
                          >
                            Log out
                          </Button>
                        </Popover.Close>
                      </div>
                    </Popover.Content>
                  </Popover>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setLoginModalOpen(true)}
                    className="min-h-7"
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
