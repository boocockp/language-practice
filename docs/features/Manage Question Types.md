User Feature: Manage Question Types
===================================

Overview
--------

The user can manage the question types that are used to generate practice questions.
They can list existing question types, add or amend question types, and under certain conditions delete them.
They can edit several fields of each question type.
They can see other statistics and information about each question type, based on the question attempts in which it has been used.


Requirements - Part 1
---------------------

- The user can only manage question types that belong to them (userId is the current logged in user), for the current language of the session (see Current Language.md)
- Navigating to the /questiontypes path shows a table of all the question types in the database for the current user and language, one per row
- All the question types are shown, in ascending order using the standard collating sequence for the current language (this may change to a paginated display in the future)
- The table shows these fields described for the `questionTypes` type in @DATA_MODEL.md: name, questionTemplate


Requirements - Part 2
---------------------

- The question types table should be usable on small phones in portrait orientation
- The name and question template each show an ellipsis if they overflow


Requirements - Part 3
---------------------

- The user can view full details of a question type and edit the details

### Screen layout
- When the user clicks on a row in the question types table, a details form for that question type appears
- On screen sizes which are wide enough, the table remains visible and the details form appears to the right of the table
- On smaller screen sizes, the details form replaces or overlays the table

### Routing
- When a question type is selected to display details, the URL changes to include the question type id at the end of the path
- A URL with a question type id is a bookmarkable deep link to that question type with details shown
- When the question types page is displayed with a deep link to a question type, on a screen wide enough to show both the table and details form, the table and details form both appear, and the table is scrolled to show the selected question type
- The browser back button acts normally, moving back through selected question types and eventually back to the table on its own

### Details form
- The form includes all the fields of the `questionTypes` record in @DATA_MODEL.md except userId and language
- All the fields can be edited
- The xxxTemplate fields are shown as textareas
- There is a Save button to save changes
- There is a Cancel button to abandon any changes 
- There is also a close button with an X icon in the top right corner of the details view

### Navigation
- After clicking the Save, Cancel or Close button, go back to showing the table on its own
- If the table is visible beside the details view, clicking on a different row will change the content of the details of the view to the question type for that row
- If the details form has been edited but not saved, any attempt to navigate away by using the close button, the browser back button, or clicking a different row in the table will show a modal dialog prompt to confirm that the changes should be abandoned
- The Cancel button does not show the confirm prompt

Requirements - Part 4
---------------------

- The user can add a new question type
- There is an Add button on the same row as the 'Question Types' title, justified to the right, with a '+' icon 
- Clicking the Add button navigates to a path /questionTypes/_new
- The Question type details form is shown, as for editing an existing question type
- The Save button inserts a new question type into the database
- All the other details for Screen Layout, Routing, form fields and Navigation are as for editing a question type in Requirements - Part 3
- Reuse the same Details Form component as for editing

### Other changes
- Validation of question type details inputs: Name cannot be empty
- The title of the Question type Details form is the Name of the question type when editing an existing question type, or 'New Question Type' when adding a question type



Future requirements
-------------------


