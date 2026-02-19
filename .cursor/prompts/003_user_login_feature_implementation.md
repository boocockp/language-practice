# User login feature implementation planning
_Exported on 19/02/2026 at 8:26:13 GMT from Cursor (2.5.17)_

---

**User**

Please plan how to implement the requirements of the feature described in @docs/features/User Login.md .  Ask supplementary questions to clarify requirements or implementation details as necessary.

---

**Cursor**


Reading the User Login feature doc and exploring the codebase to draft an implementation plan.



Exploring the codebase and Convex Auth setup.



Checking the app layout, Convex schema, and Convex Auth (email+password) docs.



Fetching the Convex Auth setup guide and inspecting the Convex and app structure.



Checking how Convex is used in the app and fetching the Convex Auth password (email+password) config.



Fetching the Convex Auth passwords setup and checking for existing Convex functions and schema.



Checking Convex Auth authorization (how to get current user on client and backend) and whether the app has Convex provider wiring:



Checking Convex Auth manual setup and custom schema for table names and structure:



Checking the router to see how routes are structured:



Asking one quick clarification:


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Implementing the User Login feature per the plan. Checking current todos and starting work.



Starting implementation: installing Convex Auth dependencies and setting up the backend.



Doing manual Convex Auth setup: creating auth config, auth module, and HTTP router.



Checking auth table shapes so we can add our schema:



Adding the `currentUser` query:



Proceeding with the client: adding ConvexAuthProvider and AuthContext. We'll run codegen with `npx convex dev` when the Convex deployment is available.



Adding the nav bar login control and LoginModal.



Creating the LoginModal component and updating AppLayout.



Adjusting LoginModal layout: moving the close button into the header and fixing the Dialog structure.



Fixing the react-refresh lint error in AuthContext (same pattern as CurrentLanguageContext):



Updating documentation:



Summary of what was implemented:

## 1. Convex Auth (backend)

- **Dependencies**: `@convex-dev/auth` and `@auth/core@0.37.0` added.
- **Config**: `convex/auth.config.ts` (provider domain/applicationID), `convex/auth.ts` (Password provider only, no reset/verify), `convex/http.ts` (HTTP router with `auth.addHttpRoutes`).
- **Schema**: `convex/schema.ts` with `authTables` plus `words`, `questionTypes`, and `attempts` (with `userId` and indexes).
- **Current user**: `convex/users.ts` exposes a `currentUser` query using `getAuthUserId`.

## 2. Client provider and auth context

- **main.tsx**: `ConvexReactClient` and `ConvexAuthProvider` wrap the app; `CurrentLanguageProvider` and `AuthProvider` sit inside.
- **AuthContext** (`src/contexts/AuthContext.tsx`): Uses `useQuery(api.users.currentUser)` and `useAuthActions()`; exposes `user`, `isLoading`, `signIn`, `signOut` via `useAuth()`.

## 3. Nav bar and login modal

- **AppLayout**: To the right of the language select, a “Log in” button when signed out, and “{email/name}” + “Log out” when signed in. Modal open state lives in the layout.
- **LoginModal** (`src/features/auth/LoginModal.tsx`): Kumo `Dialog` with sign-in/sign-up form (email, password, flow toggle), submit → `signIn("password", formData)`, close on success; labels and structure kept accessible.

## 4. Documentation

- **ARCHITECTURE.md**: New “Authentication” section (Convex Auth, email+password, session across tabs, `AuthContext`, `userId` scoping).
- **DATA_MODEL.md**: Note that `users` and auth tables come from Convex Auth `authTables`.
- **User Login.md**: “Implemented” section added with pointers to ARCHITECTURE and `AuthContext`.

## 5. Other

- **ESLint**: `convex/_generated` added to `globalIgnores`; `react-refresh/only-export-components` disabled for the `useAuth` export in `AuthContext`.

**Manual step for Convex Auth**: In the Convex dashboard, set the env vars from the [manual setup](https://labs.convex.dev/auth/setup/manual) (e.g. run the `generateKeys.mjs` script and set `JWT_PRIVATE_KEY` and `JWKS`). For local dev you can run `npx convex dev` and set `SITE_URL` if needed; password-only auth does not require `SITE_URL`. Ensure `VITE_CONVEX_URL` is set in `.env.local` for the Vite app.

`npm run typecheck` and `npm run lint` both pass.

---

**User**

Verify this issue exists and fix it:

The `error` state in the login modal is not cleared when the modal is closed and reopened. When a user encounters a sign-in error, closes the modal, and reopens it, the previous error message remains visible. This confuses users and can lead them to think the modal is malfunctioning or that their previous attempt is still showing. @src/features/auth/LoginModal.tsx:9-31 

---

**Cursor**


Confirming the issue: `error` (and `step`/`isSubmitting`) persist because the component stays mounted when the dialog is closed. Resetting them when the modal opens.



Summary of changes:

**Issue:** The modal component stays mounted when closed, so `error` (and `step` / `isSubmitting`) were kept. Reopening the modal showed the old error and step.

**Fix:** A `useEffect` that runs when `open` becomes `true` now:
- Clears `error` so no stale message is shown
- Resets `step` to `"signIn"` so the modal opens on the sign-in view
- Resets `isSubmitting` to `false` so the form isn’t stuck in a submitting state

Each time the user opens the modal they get a clean form and no leftover error.

---

**User**

When login fails due to either an invalid email address or an incorrect  password, a long error message with a stack trace is shown in the Login modal.  Please just  show the message "Invalid email or password" in both cases

---

**Cursor**


Replacing the raw error with the user-friendly message "Invalid email or password" for sign-in/sign-up failures.



Update made. Any failed sign-in or sign-up (invalid email, wrong password, or other auth error) now shows only **"Invalid email or password"** instead of the raw error or stack trace. The `catch` block no longer uses the thrown value, so no error details are shown to the user.

---

**User**

PLease commit changes with a suitable message

---

**Cursor**


Committing staged changes with a descriptive message:



Committed on `main` as `69b03eb` with message:

**feat(auth): add user login with Convex Auth (email + password)**

- Convex Auth backend: auth config, Password provider, http routes, schema (authTables + words/questionTypes/attempts), currentUser query  
- Client: ConvexAuthProvider, AuthContext (useAuth), LoginModal in nav (right of language select)  
- Login modal: sign-in/sign-up form, reset state on reopen, show “Invalid email or password” on auth failure  
- Docs: ARCHITECTURE (Authentication), DATA_MODEL (users/sessions), User Login feature  

19 files changed, 782 insertions, 36 deletions.

