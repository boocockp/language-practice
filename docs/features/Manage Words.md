Feature: Manage Words
=====================

Overview
--------

The user can manage the words that are used to generate practice questions.
They can list existing words, add or amend words, and under certain conditions delete them.
They can edit several fields of each word.
They can see other statistics and information about each word, based on the question attempts in which it has been used.


Current Requirements
------------

- The user can only manage words that belong to them (userId is the current logged in user), for the current language of the session (see Current Language.md)
- Navigating to the /words path shows a table of all the words in the database for the current user and language, one word per row
- All the words are shown, in ascending order using the standard collating sequence for the current language (this may change to a paginated display in the future)
- The table shows these fields described for the `words` type in @DATA_MODEL.md: text, pos, gender, meaning, tags

Future requirements
-------------------

- Select a row in the table to show a dialog for editing the fields
