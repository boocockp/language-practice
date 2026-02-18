## Data model (draft)

This is intentionally minimal and should be updated as the domain model becomes concrete.

### Standard fields
Every record will have the Convex standard fields _id and _creationTime

### `words`
Represents vocabulary items.  Each word is for a particular language and a particular user.

Fields:
- `language`: target language as a two-letter code, eg 'en', 'fr'
- `text`: the word/phrase
- `pos`: the part of speech - 'noun', 'verb', 'adjective'
- `gender`: for nouns only - 'M', 'F', 'N'
- `meaning`: translation/gloss
- `tags`: optional categories - space separated list of tag names


### `questionTypes`
Defines how to generate questions from words.

Suggested fields (example):
- `language`: target language as a two-letter code, eg 'en', 'fr'
- `name`
- `promptTemplate` / parameters needed for generation
- `enabled`

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

