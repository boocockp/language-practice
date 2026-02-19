# Responsive & mobile checklist

Use this when implementing or reviewing UI so the app works well on small screens and touch devices.

## Layout & breakpoints

- [ ] **Mobile-first**: Base styles target the smallest viewport; use `sm:`, `md:`, `lg:` only for larger-screen overrides.
- [ ] **Horizontal padding**: Content has `px-4` or `px-6` on small screens so it doesn’t touch the edges.
- [ ] **Line length**: Long text uses `max-w-prose` (or similar) on large screens.
- [ ] **Navigation**: On narrow viewports, nav wraps or collapses (e.g. `flex-wrap` or a hamburger); no horizontal scroll.

## Touch & interaction

- [ ] **Touch targets**: Buttons, links, and form controls have at least ~44×44px tap area (e.g. `min-h-11 min-w-11` or `p-3`).
- [ ] **Hit area**: Padding (not margin) is used to enlarge the clickable/tappable region.
- [ ] **Focus visible**: Focus states are clear for both keyboard and touch users.

## Forms

- [ ] **Input width**: Inputs use `w-full` where appropriate in narrow containers.
- [ ] **Labels & errors**: Labels and error text stay visible and readable on small screens.
- [ ] **Font size**: Inputs use at least 16px font size (or equivalent) to avoid iOS zoom on focus.

## Safe areas (notches, home indicator)

- [ ] **Viewport**: `index.html` has `viewport-fit=cover` in the viewport meta tag.
- [ ] **Full-bleed / fixed UI**: Any fixed or full-bleed element at the top/bottom/sides uses safe-area utilities so content isn’t under the notch or home indicator:
  - Padding: `pt-safe`, `pr-safe`, `pb-safe`, `pl-safe`, `px-safe`, `py-safe`, `p-safe`
  - Margin: `mt-safe`, `mr-safe`, `mb-safe`, `ml-safe`
  - Full-height content: `min-h-screen-safe` (viewport height minus top/bottom safe insets)

## Testing

- [ ] **Device mode**: Check key screens in browser DevTools device emulation (e.g. 375×667, 390×844).
- [ ] **Real device**: When possible, test on a real phone or tablet (touch, safe areas, keyboard).

## References

- Cursor rule: `.cursor/rules/responsive-mobile.mdc`
- Tailwind breakpoints: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px
