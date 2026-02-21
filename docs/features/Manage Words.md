User Feature: Manage Words
=====================

Overview
--------

The user can manage the words that are used to generate practice questions.
They can list existing words, add or amend words, and under certain conditions delete them.
They can edit several fields of each word.
They can see other statistics and information about each word, based on the question attempts in which it has been used.


Requirements - Part 1
---------------------

- The user can only manage words that belong to them (userId is the current logged in user), for the current language of the session (see Current Language.md)
- Navigating to the /words path shows a table of all the words in the database for the current user and language, one word per row
- All the words are shown, in ascending order using the standard collating sequence for the current language (this may change to a paginated display in the future)
- The table shows these fields described for the `words` type in @DATA_MODEL.md: text, pos, gender, meaning, tags

Implemented: list + table on /words (Convex query `words.listByUserAndLanguage`, locale-sorted; empty state when no words or not logged in).


Requirements - Part 2
---------------------

- The words table should be usable on small phones in portrait orientation
- To achieve this, the Part of Speech and Gender columns will be made part of the Text column
- Add a POS item in the Text column, following the actual Text content, containing:
    - the first letter of the Part of Speech
    - the Gender (if present)
- Each part of the POS item will be contained in a span with a coloured background and a contrasting text colour, no space between
- The background colours for Part of Speech are: noun: green, verb: red, adjective: purple
- The background colours for Gender are M: blue, F: magenta
- The letters in the POS item are in lowercase, with no space between them
- The POS item is separated from the text by two non-breaking spaces
- The Part of Speech and Gender columns are removed 

Implemented: POS and Gender merged into Text column as coloured spans (noun/verb/adj + M/F/N), columns removed; table in overflow wrapper; usable on small phones.


Future requirements
-------------------

- Select a row in the table to show a dialog for editing the fields
