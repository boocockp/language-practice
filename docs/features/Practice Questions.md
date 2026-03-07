# User Feature: Practice Questions

Initial version: these requirements will evolve greatly after experience with the app

## Overview

The user can generate practice questions using the words and question types in the database.
After entering the answer, the app reveals the expected answer and whether the answer given is correct.

## Requirements - Stage 1

- The Practice Page shows the following elements:
    - A select with the names of all the Question Types for the current user and language
    - A paragraph with a border labelled Question
    - A text area Answer
    - A paragraph with a border labelled Expected Answer
    - A result paragraph with a border
    - A Next Question button
    - A Check Answer button
- The buttons are initially not visible
- When the user selects a Question Type, the Next Question button is visible
- When the user clicks Next Question, generate a Question (see below) and display the Question Text in the Question paragraph. Hide Next Question and show Check Answer.
- When the user clicks Check Answer:
    - set Correct to true if the Answer text area matches the Question Expected Answer (trimmed, case-insensitive), false otherwise.
    - Show the Expected Answer in the paragraph
    - Show in the results paragraph: If Correct is true, "Correct" with a tick symbol, else "Wrong" with a cross symbol
    - Hide the Check Answer button, show Next Question
- Store the Question in the database

### Generate a Question

- See [DATA_MODEL.md](../DATA_MODEL.md) for the definition of `questions`
- Use the Question Type data template to generate the data for the question
- Use the Question Type question template to generate the question text, using the data
- Use the Question Type answer template to generate the question expected answer, using the data
- The templates are processed as Handlebars templates using the particular setup for this app - see below

#### Using Handlebars

- The Handlebars library is documented at https://handlebarsjs.com/

#### Generating data for the question

- The dataTemplate format expects multiple lines, each with the format <name> = <data-expression>
- A single async Handlebars instance (using handlebars-async-helpers) is used for both the data step and the question/answer step. All helpers (e.g. storeData, word, noun, verb) are registered on this instance and are available in every template.
- The data step runs line by line. The same context object is used for each line in turn, so values stored on earlier lines can be used in later lines.
- A data-expression is processed in one of two ways:
    - If it contains a pair of left braces `{{` anywhere, it is treated as a Handlebars template: the expression is compiled and run with the current context, and the resulting string is stored under the associated name.
    - If it contains no braces, it is wrapped in a storeData expression: `{{{storeData "<name>" ( <data-expression>)}}}`. The storeData helper awaits the value (which may be a promise from e.g. the word helper), then stores it in the context under the given name.
- Only lines that match `<name> = <data-expression>` are processed; blank lines and malformed lines are skipped.
- Each template execution is awaited so async helpers (e.g. word) work correctly as subexpressions.

#### Generate question and answer

- The same Handlebars instance from the data step is used. Compile the questionTemplate and answerTemplate, then await each template with the data from the data step.
- The data is the accumulated context produced by the data step (so all stored names are available).
- Language-specific helpers (e.g. noun, verb) and post-process for contractions/elisions are applied when configured for the question language.

## Notes

- The name of the `attempts` table is changed to `questions`

## Implementation notes – Stage 1

- **dataTemplate**: Lines `<name> = <data-expression>` are processed line by line. If the expression contains `{{`, it is compiled and run as a template and the string result is stored under `name` in the context. Otherwise the line is rendered as `{{{storeData "<name>" ( <data-expression>)}}}` and the storeData helper (which awaits the value) stores the result in the same context. The same context is passed to each line so earlier values can be used in later lines. Empty dataTemplate passes `{}` to the question/answer step.
- **Async Handlebars**: One Handlebars instance is created via handlebars-async-helpers and used for both the data step and the question/answer step. All helpers (storeData, word, and when configured noun/verb etc.) are registered on this instance. Template execution is awaited.
- **word helper**: Named arg `text` (and later `type`, `tags`). Looks up a word for the current user and language; returns `{ _id, text, type, meaning }` or null. Available in the data template (and in question/answer templates via the stored data).
- **Question/answer step**: Uses the same Handlebars instance and the accumulated data (context) from the data step. No separate `word` helper is needed in the template at render time—templates use the stored data (e.g. `{{word.text}}`, `{{word.meaning}}`).

## Requirements - Stage 2 - Random Word selection by properties

- The word helper has a `type` hash option and a `tags` hash option in addition to the `text` option
- The `type` option may be a single type name, or a comma-separated list of types
- The `tags` option is one or more comma-separated lists of tag names, joined with & characters
- The `text` option may now be a comma-separated list of words
- None of the options is required
- No spaces are allowed in the options as Handlebars would treat the part after the space as a separate argument
- The helper queries the database matching on the options provided as follows:
    - `type` matches words whose type is one of the types in the list eg 'nm,nf' matches records where type is either 'nm' or 'nf'
    - `text` matches words whose text is one of the words in the list eg 'chat,chaise' matches records where text is either 'chat' or 'chaise'
    - `tags` is split into tag lists by the & character. The tags field in each record is split on spaces. A record matches if for all of the tag lists, at least one of the tags in the list matches one of the tags in the record
    - For example if the `tags` option is abc&ghi,jkl it will match a record with tags of 'abc ghi xyz' but not a record with tags of 'ghi pqr'
    - A record is selected if it matches on all the options provided
- From all the records selected, one is chosen at random

### Technical notes

- Refactor the word helper into a separate function that takes a LookupWordFn argument and returns the helper function
- Create a separate unit test for this function

## Implementation notes – Stage 2

- **word helper** (data step only): Now supports optional hash options `text`, `type`, `tags`. Implemented via `createWordHelper(lookupWord)` which extracts options from `options.hash` and passes them to `LookupWordFn`. Empty string for an option is treated as not provided.
- **LookupWordFn**: Signature changed to `(options: WordLookupOptions) => Promise<{ text, meaning } | null>` where `WordLookupOptions = { text?: string; type?: string; tags?: string }`.
- **getRandomByCriteria** (internal action in words): Calls `getMatchingWordsByCriteria` (internal query) then picks one at random. Implemented as an action so the random selection is not cached. Filters by:
    - `text`: comma-separated list; word.text must be in the list
    - `type`: comma-separated list; word.type must be in the list
    - `tags`: groups joined by `&`; each group is comma-separated; for each group, at least one tag must appear in the word's tags (AND across groups)
- If no options provided, returns a random word from all words for user+language. From matching words, one is chosen at random via `Math.random()`.
- **Template syntax**: Comma-separated or special characters in option values require quoted strings in Handlebars (e.g. `word type="nm,nf"`, `word tags="abc&ghi,jkl"`).

## Implementation notes – Stage 2a

- **wordIds on questions**: Schema field `wordIds: v.optional(v.array(v.id("words")))` stores the set of word IDs used during generation. Replaces former `wordId` (singular).
- **LookupWordFn / getRandomByCriteria**: Return type now includes `_id` and `type` so the action can collect word IDs and template helpers can use gender. Templates use `text`, `meaning`, and (for noun/verb helpers) `type`.
- **practiceActions**: Wraps `lookupWord` to append `result._id` to a `wordIds` array; passes deduplicated `[...new Set(wordIds)]` to `insertGeneratedQuestion`.
- **insertGeneratedQuestion**: Accepts optional `wordIds` arg and stores it on the question.

## Template helpers (noun, verb)

- **noun** and **verb** helpers are available in the data template, question template, and answer template when the question language is French (same Handlebars instance and helpers for all steps).
- Implemented in `convex/templateHelpers.ts`; the full rendered output is post-processed for contractions/elisions.
- Word results from the data step include `type` for gender agreement. See `docs/features/Template Helpers.md`.

## Requirements - Stage 2a - Store words used in questions

- Add a field to Question that can store a set of word ids. This may be an array if Convex supports it, or a string containing a comma-separated list
- For each word used in a Question, store its id in the Question's words field
