import { NavLink, Outlet } from "react-router-dom";

import { cn } from "../lib/cn";

const navItems = [
  { to: "/", label: "Home", end: true as const },
  { to: "/practice", label: "Practice" },
  { to: "/words", label: "Words" },
  { to: "/question-types", label: "Question Types" },
  { to: "/stats", label: "Stats" },
  { to: "/settings", label: "Settings" },
];

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <nav aria-label="Primary" className="mx-auto flex max-w-5xl px-4 py-3">
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
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

