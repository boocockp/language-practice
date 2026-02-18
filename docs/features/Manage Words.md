Feature: Manage Words
=====================

Overview
--------

The user can manage the words that are used to generate practice questions.
They can list existing words, add or amend words, and uder certain conditions delete them.
They can edit several characteristics of each word.
They can see other statistics and information about each word, based on the question attempts in which it has been used.


Requirements
------------

- The user can only manage words for the current language of the session (see Current Language.md)
- Navigating to the /words path shows a list of all the words in the database for the current language
- All the words are shown, in ascending order using the standard collating sequence for the current language (this may change to a paginated display in the future)
- The list shows all the fields described for the `words` type in @DATA_MODEL.md

