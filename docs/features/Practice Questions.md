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
    - set Correct to true if the Answer text area matches the Question Expected Answer, false otherwise.  
    - Show the Expected Answer in the paragraph
    - Show in the results paragraph: If Correct is true,  "Correct" with a tick symbol, else "Wrong" with a cross symbol
- Store the Question in the database    

### Generate a Question

- See [DATA_MODEL.md](docs/DATA_MODEL.md) for the definition of `questions`
- Use the Question Type question template to generate the question text
- Use the Question Type answer template to generate the question expected answer
- The templates are processed as Handlebars templates using the particular setup for this app - see below

### Using Handlebars
- The Handlebars library is documented at https://handlebarsjs.com/
- Add a helper function for this app called `word`
- The `word` helper:
    - takes one named argument, called `text`
    - It selects the first word in the database for the current user and language which has `text` equal to the argument
    - It returns an object with properties `text` and `meaning` from the database record
    