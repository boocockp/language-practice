# Implementation planning for current language features
_Exported on 19/02/2026 at 8:24:30 GMT from Cursor (2.5.17)_

---

**User**

PLease plan how to implement the requirements in @docs/features/Current Language.md 

---

**Cursor**


Exploring the codebase to understand the app structure.



Creating an implementation plan for the Current Language feature.


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Fixing type errors and lint issues:



Here’s what was implemented:

## Summary

**New files**
- **`src/lib/languages.ts`** – `LANGUAGES` (fr/en), `getLanguageName(code)`, `isSupportedLanguage(code)`
- **`src/contexts/CurrentLanguageContext.tsx`** – Context, `CurrentLanguageProvider`, `useCurrentLanguage()` with per-tab `sessionStorage`

**Modified files**
- **`src/main.tsx`** – Wrapped app with `CurrentLanguageProvider`
- **`src/app/AppLayout.tsx`** – Language dropdown (Kumo `Select`) on the right side of the nav bar with labels “Français” and “English”
- **`docs/DATA_MODEL.md`** – Language filtering section
- **`docs/ARCHITECTURE.md`** – Current Language section

**Details**
- Language selection persisted per-tab via `sessionStorage`
- Default language: `en`
- Nav layout: `justify-between` with dropdown aligned right
- Select uses `hideLabel` and an accessible label “Current language”
- Typecheck, lint, and build all pass

---

**User**

The language select in the nav bar shows the language code of the current selection.  Please make it show the name of the language

---

**Cursor**


Adding a `renderValue` prop to show the language name instead of the code:



Update complete. The Select now uses `renderValue` to display the language name via `getLanguageName()`, so the trigger shows "Français" or "English" instead of "fr" or "en".

---

**User**

On the Home page, please add a para under the title with the message:
"You are studying " + <current-language-name>

---

**Cursor**


Added the paragraph under the title. It now shows "You are studying Français" or "You are studying English" based on the selected language.

---

**User**

why is every npm command that you run emitting a warning Unknown env config "devdir"?

---

**Cursor**


The warning isn’t coming from this repo. There’s no `.npmrc` here and no reference to `devdir` in the project.

It’s almost certainly coming from your user-level npm config (e.g. `~/.npmrc`). npm is loading a `devdir` config that it doesn’t recognize, so it prints the warning.

**Check where it’s set**

```bash
npm config list
```

or:

```bash
npm config get devdir
```

**Remove it**

```bash
npm config delete devdir
```

`devdir` was sometimes used by older tools (e.g. some Node version managers or generators). It’s not part of npm’s built-in config, so removing it won’t affect normal npm behavior.

