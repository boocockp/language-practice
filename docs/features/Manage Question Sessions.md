User Feature: Manage Question Session Types
===========================================

Overview
--------

The user can manage the session types that are used to generate sessions of practice questions.
They can list existing session types, add or amend session types, and under certain conditions delete them.
They can edit several fields of each session type.
They can see other statistics and information about each session type, based on the sessions in which it has been used.

This feature follows the pattern of Manage Words and Manage Question Types

See DATA_MODEL.md for a definition of the `sessionType` type

Requirements
------------

Requirements are generally the same as in Manage Words.md and Manage Question Types.md
Specific requirements for Session Types are:
- New page called Session Types, with another button in the nav bar and hamburger menu to navigate to it
- The path to the Session Types page is /sessiontypes
- The table shows only the name of the Session Type
- The details form shows the name and an editable list of Session Questions, one per row
- The user can add, delete, edit Session Questions in the list
- The user can move Session Questions in the list (preferably by drag and drop, maybe by up/down buttons)
- Session Question list changes are not saved until the whole details form is saved
- Validation of session type details inputs: Name cannot be empty
- The Session Type can be saved with an empty Session Question list
- The title of the Session type Details form is the Name of the session type when editing an existing record, or 'New Session Type' when adding


Technical Issues
----------------

- Should `sessionQuestion`s be a separate table, or an array inside a `sessionTypes` record?
- What is the best React component available for editable lists?