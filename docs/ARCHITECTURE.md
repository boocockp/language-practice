## Architecture

### High-level flow
- The user starts a practice session.
- The app requests the next question from the backend.
- The user submits an answer.
- The backend stores the attempt and updates any scheduling/scoring state.
- The next question selection is informed by prior attempts.

### Responsibilities
- **Frontend (React)**: routing, UI rendering, local interaction state.
- **Backend (Convex)**: data model, question generation, scoring, selection/scheduling.

### Key screens
- Home: entry point and navigation
- Practice: show current question, accept answer, show feedback, advance
- Words: manage word list
- Question Types: manage templates/behaviors
- Stats: show progress/history summaries
- Settings: learner preferences

