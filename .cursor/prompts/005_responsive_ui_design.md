# Responsive UI design
_Exported on 19/02/2026 at 11:46:42 GMT from Cursor (2.5.17)_

---

**User**

How should I ensure that you generate UI code that gives the best possible responsive experience when using this site on a mobile device? What rules should I amend or add?  Are there any other ways to improve the appearance on mobile devices?

---

**Cursor**


Checking your styling rules and project setup so we can recommend responsive/mobile rules and improvements.



Checking for existing CSS and one more feature component to see current patterns:



Adding a dedicated responsive/mobile rule and a short mobile-first note to the Tailwind styling rule.



Summary of what’s in place and what you can do next:

---

## 1. **New rule: `responsive-mobile.mdc`**

Created `.cursor/rules/responsive-mobile.mdc` so generated UI follows:

- **Mobile-first** – base styles for small screens, then `sm:`, `md:`, `lg:` for larger.
- **Touch targets** – at least ~44×44px for buttons, links, nav items (e.g. `min-h-11 min-w-11` or `p-3`).
- **Readable width** – `max-w-prose` for text; horizontal padding (`px-4` / `px-6`) on small screens.
- **Safe areas** – use safe-area insets for full-bleed or fixed UI (notches, home indicator).
- **Forms** – full-width inputs where it makes sense; clear labels and focus.
- **Navigation** – wrap or collapse on narrow viewports; keep items easy to tap.

This rule is scoped to `src/**/*.{ts,tsx,css}` and is not `alwaysApply`, so it’s used when working on UI.

---

## 2. **Updated rule: `styling-tailwind.mdc`**

Added one bullet that:

- Tells the agent to design mobile-first and use Tailwind breakpoints.
- Points to the responsive-mobile rule for touch targets, safe areas, and layout.

---

## 3. **Other ways to improve mobile**

- **Viewport** – You already have `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` in `index.html`; keep it.
- **Layout** – Your nav uses `flex flex-wrap` and main uses `max-w-5xl px-4`, which is a good base. For very small screens you may want a hamburger or stacked nav; the new rule encourages wrapping or a collapsible menu.
- **Safe-area utilities** – Tailwind v4 may not include `pb-safe` etc. out of the box. If you use fixed bottom/top bars, add custom utilities or use `env(safe-area-inset-bottom)` in your CSS; the rule already mentions this.
- **Testing** – Test on real devices or Chrome DevTools device mode; the rules don’t replace that.
- **Kumo** – Kumo components should be responsive by default; use Tailwind wrappers (e.g. `w-full` on small screens) when you need full-width or different spacing on mobile.
- **Font size** – Avoid small body text (e.g. keep base at least 16px) so iOS doesn’t zoom on focus; your current `text-sm` in nav is fine for secondary UI.

If you want, next step can be: add a small “responsive checklist” to `docs/` or wire safe-area utilities into your Tailwind/CSS setup.

---

**User**

Yes please carry out both of those next steps - checklist and safe-area utilities

---

**Cursor**


Adding safe-area utilities with Tailwind v4's `@utility`, then creating the responsive checklist.



Verifying Tailwind v4 @utility syntax:



Summary of what’s in place:

---

## 1. Safe-area utilities and viewport

**`index.html`**  
- Viewport meta updated to include `viewport-fit=cover` so the page can extend into safe areas and `env(safe-area-inset-*)` works.

**`src/index.css`**  
- Custom utilities added with Tailwind v4 `@utility` (no extra plugin):

  - **Padding:** `pt-safe`, `pr-safe`, `pb-safe`, `pl-safe`, `px-safe`, `py-safe`, `p-safe`
  - **Margin:** `mt-safe`, `mr-safe`, `mb-safe`, `ml-safe`
  - **Height:** `min-h-screen-safe` — `min-height` set to viewport height minus top and bottom safe insets (for full-height content that should stay within the safe area).

Use these on fixed or full-bleed UI (e.g. sticky header, bottom nav, edge-to-edge sections) so content isn’t under notches or the home indicator.

---

## 2. Responsive checklist

**`docs/RESPONSIVE_CHECKLIST.md`**  
- Checklist for implementing or reviewing UI:
  - Layout & breakpoints (mobile-first, padding, line length, nav)
  - Touch & interaction (target size, hit area, focus)
  - Forms (width, labels, font size)
  - Safe areas (viewport meta, when to use which utility)
  - Testing (device emulation, real device)
- References the responsive-mobile rule and Tailwind breakpoints.

---

## 3. Rule update

**`.cursor/rules/responsive-mobile.mdc`**  
- Safe-areas bullet now lists the project’s utilities and points to `docs/RESPONSIVE_CHECKLIST.md`.

---

`npm run typecheck` and `npm run lint` both pass. For a fixed bottom bar you’d add `pb-safe` (and optionally `px-safe`); for a sticky header, `pt-safe`. The checklist is in `docs/RESPONSIVE_CHECKLIST.md` for you or the agent to use when building or reviewing screens.

