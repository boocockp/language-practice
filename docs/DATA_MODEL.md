## Data model (draft)

This is intentionally minimal and should be updated as the domain model becomes concrete.

### `words`
Represents vocabulary items.

Suggested fields (example):
- `language`: target language code/name
- `text`: the word/phrase
- `meaning`: translation/gloss
- `tags`: optional categories
- `createdAt`

### `questionTypes`
Defines how to generate questions from words.

Suggested fields (example):
- `name`
- `promptTemplate` / parameters needed for generation
- `enabled`
- `createdAt`

### `attempts`
Stores generated questions + learner responses.

Suggested fields (example):
- `wordId` (reference to `words`)
- `questionTypeId` (reference to `questionTypes`)
- `questionText` (or structured question payload)
- `answerGiven`
- `isCorrect` / `score`
- `respondedAt`
- `durationMs` (optional)

### Index notes
You will likely need indexes for:
- recent attempts by `wordId`
- recent attempts by `questionTypeId`
- scheduling queries (e.g. “due” items), once defined

