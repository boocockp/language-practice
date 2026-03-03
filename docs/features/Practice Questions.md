User Feature: Practice Questions
================================

Initial version: these requirements will evolve greatly after experience with the app

Overview
--------

The user can generate practice questions using the words and question types in the database.
After entering the answer, the app reveals the expected answer and whether the answer given is correct.

Requirements - Stage 1
----------------------

- The Practice Page shows the following elements:
    - A select with the names of all the Question Types for the current user and language
    - A paragraph with a border  labelled Question
    - A text area Answer
    - A paragraph with a border labelled Expected Answer
    - A result paragraph  with a border
    - A Next Question button
    - A Check Answer button
 - The buttons are initially not visible
 - When the user selects a Question Type, the Next Question button is visible
 - When the user clicks Next Question, generate a Question  (see below) and display the Question Text in the Question paragraph.  Hide Next Question and show Check Answer.
 - When the user clicks Check Answer:
    - set Correct to true if the Answer text area matches the Question Expected Answer (trimmed, case-insensitive), false otherwise.  
    - Show the Expected Answer in the paragraph
    - Show in the results paragraph: If Correct is true,  "Correct" with a tick symbol, else "Wrong" with a cross symbol
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
- We use Handlebars in an unusual way to create the question data, but this allows the user to use one syntax for both the data generation and the question/answer templates
- From the dataTemplate, create a template where each line is of the format `{{storeData "<name>" ( <data-expression>)}}`
- Create an isolated Handlebars instance using Handlebars.create
- Register a storeData helper which has arguments name, value.  It awaits value (which may be a promise), then stores it in a dictionary object with the key name.  The dictionary object is used to collect the data values for the next step, Generate question and answer
- Also register a set of helpers that the user can call in <data-expression>.  The only one at this stage is `word`, which:
    - takes one named argument, called `text`
    - It selects the first word in the database for the current user and language which has `text` equal to the argument
    - It returns an object with properties `text` and `meaning` from the database record
- Call Handlebars.compile, then Handlebars.template with the compiled template, ignore the result

#### Generate question and answer
- Create an isolated Handlebars instance using Handlebars.create
- Compile the questionTemplate and answerTemplate
- Call Handlebars.template with each one, passing the data from the previous step
- On this call Handlebars
- Add a custom helper function called `word`
- The `word` helper:
    - takes one named argument, called `text`
    - It selects the first word in the database for the current user and language which has `text` equal to the argument
    - It returns an object with properties `text` and `meaning` from the database record

Notes
-----

- The name of the `attempts` table is changed to `questions`

Implementation notes – Stage 1
------------------------------

- **dataTemplate**: Each line `<name> = <data-expression>` is transformed to `{{{storeData "<name>" ( <data-expression>)}}}`. The `storeData` helper awaits the value (which may be a Promise) and stores it in a dictionary. Empty dataTemplate passes `{}` to the question/answer step.
- **word helper** (data step only): Named arg `text`. Looks up the first word for the current user and language with that `text`, returns `{ text, meaning }` or null. Async; used only in the data step.
- **Question/answer step**: No `word` helper (async would not work). Templates use only the stored data from the data step (e.g. `{{word.text}}`, `{{word.meaning}}`).

Requirements - Stage 2 - Random Word selection by properties
----------------------

- The word helper has a `type` hash option and a `tags` hash option in addition to the `text` option
- The `type` option may be a single type name, or a comma-separated list of types
- The `tags` option is one or more comma-separated lists of tag names, joined with & characters
- The `text` option may now be a comma-separated list of words
- None of the options is required
- No spaces are allowed in the options as Handlebars would treat the part after the space as a separate argument
- The helper queries the database matching on the options provided as follows:
    - `type` matches words whose type is one of the types in the list eg 'nm,nf' matches records where type is either 'nm' or 'nf'
    - `text` matches words whose text is one of the words in the list eg 'chat,chaise' matches records where text is either 'chat' or 'chaise'
    - `tags` is split into tag lists by the & character.  The tags field in each record is split on spaces.  A record matches if for all of the tag lists, at least one of the tags in the list matches one of the tags in the record
    - For example if the `tags` option is abc&ghi,jkl it will match a record with tags of 'abc ghi xyz' but not a record with tags of 'ghi pqr'
    - A record is selected if it matches on all the options provided
- From all the records selected, one is chosen at random

### Technical notes
- Refactor the word helper into a separate function that takes a LookupWordFn argument and returns the helper function
- Create a separate unit test for this function

Implementation notes – Stage 2
------------------------------

- **word helper** (data step only): Now supports optional hash options `text`, `type`, `tags`. Implemented via `createWordHelper(lookupWord)` which extracts options from `options.hash` and passes them to `LookupWordFn`. Empty string for an option is treated as not provided.
- **LookupWordFn**: Signature changed to `(options: WordLookupOptions) => Promise<{ text, meaning } | null>` where `WordLookupOptions = { text?: string; type?: string; tags?: string }`.
- **getRandomByCriteria** (internal action in words): Calls `getMatchingWordsByCriteria` (internal query) then picks one at random. Implemented as an action so the random selection is not cached. Filters by:
  - `text`: comma-separated list; word.text must be in the list
  - `type`: comma-separated list; word.type must be in the list
  - `tags`: groups joined by `&`; each group is comma-separated; for each group, at least one tag must appear in the word's tags (AND across groups)
- If no options provided, returns a random word from all words for user+language. From matching words, one is chosen at random via `Math.random()`.
- **Template syntax**: Comma-separated or special characters in option values require quoted strings in Handlebars (e.g. `word type="nm,nf"`, `word tags="abc&ghi,jkl"`).

Implementation notes – Stage 2a
------------------------------

- **wordIds on questions**: Schema field `wordIds: v.optional(v.array(v.id("words")))` stores the set of word IDs used during generation. Replaces former `wordId` (singular).
- **LookupWordFn / getRandomByCriteria**: Return type now includes `_id` and `type` so the action can collect word IDs and template helpers can use gender. Templates use `text`, `meaning`, and (for noun/verb helpers) `type`.
- **practiceActions**: Wraps `lookupWord` to append `result._id` to a `wordIds` array; passes deduplicated `[...new Set(wordIds)]` to `insertGeneratedQuestion`.
- **insertGeneratedQuestion**: Accepts optional `wordIds` arg and stores it on the question.

Template helpers (noun, verb)
-----------------------------

- **noun** and **verb** helpers are available in question and answer templates (not in the data template) when the question language is French.
- Implemented as RosaeNLG wrappers in `practiceActions`; the full rendered output is post-processed for contractions/elisions.
- Word results from the data step now include `type` for gender agreement. See `docs/features/Template Helpers.md`.

Requirements - Stage 2a - Store words used in questions
----------------------

- Add a field to Question that can store a set of word ids.  This may be an array if Convex supports it, or a string containing a comma-separated list
- For each word used in a Question, store its id in the Question's words field