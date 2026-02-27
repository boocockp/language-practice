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
