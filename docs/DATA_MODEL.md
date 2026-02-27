## Data model (draft)

This is intentionally minimal and should be updated as the domain model becomes concrete.

### Users and sessions

The `users` table and `authSessions` (and related auth tables) come from Convex Auth (`authTables` in the schema). User-scoped tables reference `users` via a `userId` field.

### Language filtering

All language-scoped data (`words`, `questionTypes`, and related records) is filtered by the `language` field. The client passes the current language from `useCurrentLanguage()` to all relevant Convex queries and mutations. The user sees only records where `language` matches their current selection.

### Standard fields
Every record will have the Convex standard fields _id and _creationTime

### Type definitions
- WordType: nf, nm, nmf, vtr, vi, adj, adv

### `words`
Represents vocabulary items.  Each word is for a particular language and a particular user. Single-word read, create, and update are done via Convex `words.getById` (query), `words.create` (mutation), and `words.update` (mutation), all scoped by `userId` and language.

Fields:
- `userId`: the id of the User to which this record belongs
- `language`: target language as a two-letter code, eg 'en', 'fr'
- `text`: the word/phrase
- `type`: the type of word - WordType
- `meaning`: translation/gloss
- `tags`: optional categories - space separated list of tag names


### `questionTypes`
Defines how to generate questions from words.

Fields:
- `userId`: the id of the User to which this record belongs
- `language`: target language as a two-letter code, eg 'en', 'fr'
- `name`: a descriptive name for this question type
- `dataTemplate`: the template for generating the question data
- `questionTemplate`: the template for generating the question
- `answerTemplate`: the template for generating the answer


### `questions`
Stores generated questions + learner responses.

Fields:
- `userId`: the id of the User to which this record belongs
- `language`: target language as a two-letter code, eg 'en', 'fr'
- `questionTypeId` (reference to `questionTypes`)
- `text`: the generated question
- `expected`: the generated expected answer
- `answerGiven`: optional; the answer the user entered (set when they submit)
- `isCorrect`: optional; true/false (set when they submit)
- `respondedAt`: optional; date/time (set when they submit)
- `wordId`: optional; reference to the word used (if any)
- `score`, `durationMs`: optional; for future scheduling

### Index notes
- questions by `questionTypeId`
- questions by `userId`
- questions by `userId` and `respondedAt`


