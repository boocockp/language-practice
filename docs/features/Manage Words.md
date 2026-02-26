User Feature: Manage Words
=====================

Overview
--------

The user can manage the words that are used to generate practice questions.
They can list existing words, add or amend words, and under certain conditions delete them.
They can edit several fields of each word.
They can see other statistics and information about each word, based on the questions in which it has been used.


Requirements - Part 1
---------------------

- The user can only manage words that belong to them (userId is the current logged in user), for the current language of the session (see Current Language.md)
- Navigating to the /words path shows a table of all the words in the database for the current user and language, one word per row
- All the words are shown, in ascending order using the standard collating sequence for the current language (this may change to a paginated display in the future)
- The table shows these fields described for the `words` type in @DATA_MODEL.md: text, type, meaning, tags

Implemented: list + table on /words (Convex query `words.listByUserAndLanguage`, locale-sorted; empty state when no words or not logged in).


Requirements - Part 2
---------------------

- The words table should be usable on small phones in portrait orientation
- To achieve this, the Type is made part of the Text column
- Add a Type item in the Text column, following the actual Text content, containing the Type
- The background colours for Type are: nf: magenta, nm: cyan, nmf: turquoise, vtr: red, vi: orange, adj: blue, adv: brown
- The letters in the Type item are in lowercase, with no space between them
- The Type item is justified and shown at the end of the cell

Requirements - Part 3
---------------------

- The user can view full details of a word and edit the details

### Screen layout
- When the user clicks on a row in the words table, a details form for that word appears
- On screen sizes which are wide enough, the table remains visible and the details form appears to the right of the table
- On smaller screen sizes, the details form replaces or overlays the table

### Routing
- When a word is selected to display details, the URL changes to include the word id at the end of the path
- A URL with a word id is a bookmarkable deep link to that word with details shown
- When the words page is displayed with a deep link to a word, on a screen wide enough to show both the table and details form, the table and details form both appear, and the table is scrolled to show the selected word
- The browser back button acts normally, moving back through selected words and eventually back to the table on its own

### Details form
- The form includes all the fields of the `words` record in @DATA_MODEL.md except userId and language
- All the fields can be edited
- There is a Save button to save changes
- There is a Cancel button to abandon any changes 
- There is also a close button with an X icon in the top right corner of the details view

### Navigation
- After clicking the Save, Cancel or Close button, go back to showing the table on its own
- If the table is visible beside the details view, clicking on a different row will change the content of the details of the view to the word for that row
- If the details form has been edited but not saved, any attempt to navigate away by using the close button, the browser back button, or clicking a different row in the table will show a modal dialog prompt to confirm that the changes should be abandoned
- The Cancel button does not show the confirm prompt

Requirements - Part 4
---------------------

- The user can add a new word
- There is an Add button on the same row as the 'Words' title, justified to the right, with a '+' icon 
- Clicking the Add button navigates to a path /words/_new
- The Word details form is shown, as for editing an existing word
- The Save button inserts a new word into the database
- All the other details for Screen Layout, Routing, form fields and Navigation are as for editing a word in Requirements - Part 3
- Reuse the Word Details Form component

### Other changes
- Validation of word details inputs: Text cannot be empty
- Change the title of the Word Details form to be the Meaning of the word when editing an existing word, or 'New Word' when adding a word
- Remove the text Manage your vocabulary list here.

Implemented: Add button (same row as title, + icon) → /words/_new; WordDetailsForm supports word=null (new-word mode) with title "New Word" and create payload; words.create mutation (auth, text non-empty); validation disables Save when text empty; form title = meaning when editing; paragraph removed. Unit tests for words.create and new-word UI (no duplicate edit navigation tests).


Future requirements
-------------------


