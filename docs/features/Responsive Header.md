Responsive Header
=============

Overview
--------

Make the UI appearance and UX of the app header acceptable on mobile devices, including small screen phones.

Requirements
------------

- Using the new rules in @RESPONSIVE_CHECKLIST.md, @responsive-mobile.mdc and @styling-tailwind.mdc, improve the appearance of the header on the smallest mobile device in consideration, with a screen width of 375px.

- The nav options wrap after every item, so they become stacked vertically.  Replace the nav bar with a hamburger when the screen size is too small
- Animate hamburger icon to “X” when menu is open.
- The language select takes up a lot of space, and will rarely change.  Replace it with a button showing the two-letter language code and a flag emoji, plus a down-arrow to indicate a menu, which shows a menu of available language names when clicked.  Make this change for all screen sizes.
- The user name with Logout button takes up a lot of space, and will rarely be used.  Replace these two elements with an icon representing a user.  When clicked, it shows a popover containing the name and/or email of the user, with a Logout button.   Make this change for all screen sizes.

Implemented
----------

Done. Header implemented in `src/app/AppLayout.tsx`; language flags in `src/lib/languages.ts`. Review against `docs/RESPONSIVE_CHECKLIST.md` for verification.
