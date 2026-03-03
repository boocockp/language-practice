## Architecture

### High-level flow
- The user starts a practice session.
- The app requests the next question from the backend.
- The user submits an answer.
- The backend stores the question and updates any scheduling/scoring state.
- The next question selection is informed by prior question results.

### Responsibilities
- **Frontend (React)**: routing, UI rendering, local interaction state.
- **Backend (Convex)**: data model, question generation, scoring, selection/scheduling.

### Authentication

Authentication uses [Convex Auth](https://docs.convex.dev/auth/convex-auth) (beta). The only method initially is email + password; there is no password reset. The same session is shared across all browser tabs. The current user is exposed app-wide via `AuthContext` (`useAuth()`). All user-scoped data is filtered by `userId`; Convex queries and mutations use `getAuthUserId(ctx)` and filter or set `userId` accordingly.

### Current Language

The user studies one language at a time. The selection is stored per browser tab in `sessionStorage` and exposed via `CurrentLanguageContext`. A dropdown in the nav bar lets the user switch. All Convex queries that return language-scoped data receive the current language as an argument from the client.

### Key screens
- Home: entry point and navigation
- Practice: show current question, accept answer, show feedback, advance
- Words: manage word list; word detail view and edit at `/words/:wordId`; add new word at `/words/_new`. Edits are persisted via Convex mutation `words.update`; new words via `words.create`.
- Question Types: manage question type templates; list at `/question-types`; detail and edit at `/question-types/:questionTypeId`; add new at `/question-types/_new`. Convex: `questionTypes.listByUserAndLanguage`, `questionTypes.getById`, `questionTypes.create`, `questionTypes.update`.
- Stats: show progress/history summaries
- Settings: learner preferences

### Template helpers (question/answer generation)

Question and answer templates support language-specific Handlebars helpers (e.g. `noun`, `verb`) for grammatical correctness. These live in `convex/templateHelpers.ts` as wrappers around `rosaenlg-lib` and are only active for supported languages (French initially). French verb conjugation uses a rule-based lookup (regular -er/-ir/-re rules + irregular dictionary) so Convex does not load the full Lefff conjugations file; see `docs/features/Verb conjugation.md`. The full rendered output is post-processed for contractions and elisions. See `docs/features/Template Helpers.md`.

