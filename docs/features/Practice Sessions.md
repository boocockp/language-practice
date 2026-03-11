User Feature: Practice Sessions
===============================

Initial version: these requirements will evolve greatly after experience with the app

**Implemented** (Stage 1): Practice Session page at `/practice/session`, nav entry "Practice Session", shared `PracticeQuestionBlock`, Convex `sessions` table and `sessionsActions.generateSession`, `sessions.getWithQuestions`, `sessions.endSession`.

Overview
--------

The user can generate and run a practice session with a set of questions generated from a session type.
Each question in the session is presented one by one in the same way as individual practice questions.
The overall results of the session are stored along with the individual question results. 

Requirements - Stage 1
----------------------

- Add a Practice Session nav bar button/hamburger menu option that navigates to the Practice Session page

### Initial display
- The Practice Session page initially shows the following elements:
    - A select with the names of all the Session Types for the current user and language
    - A Start button to the right of the select, disabled until a Session Type is selected
    - An instruction below shows "Choose a session type and click Start"

### Session running state   
- Enter this state when the user clicks Start
- The Session is generated and stored in the database (see Generate a Session below)
- The select becomes read-only
- The Start button is replaced by a Stop button
- A heading below the select shows: 
    - "Question n of count" where  n is the current question number starting at 1, count the number of questions in the session
    - "Score n" where n is the number of questions answered correctly so far in the Session   
- A Question area displays the current Question (starting at 1) from the Session
- The Question area layout is the same as on the existing single-question Practice page (see Shared components below)

### Session ended state
- Enter this state when either:
    - The user has answerered all the Questions and clicks Continue
    - The user clicks the Stop button
- Replace the heading and Question area with a summary of the number of questions answered and correct, and a percentage correct
- Update the Session in the database with the number of correct questions


### Shared components
- Extract a common component that is used by the single-question Practice page and the Question area on the Practice Session page
- The Check answer action will be the same in both cases - see [Practice Questions](./Practice Questions.md)
- The Next question action will be different:
    - Existing practice page generates another question
    - Practice session page moves to the next question within the Session
- When all the Questions in the Session have been answered, show a Continue button instead of Next Question
- The Continue button moves to the Session Ended state

### Generate a Session

- See [DATA_MODEL.md](../DATA_MODEL.md) for the definition of `sessions`
- Store a Session record in the database, linked to the selected Session Type
- For each of the `questions` in the selected Session Type:
    - Generate a Question using the questiont ype, for the number of times in `count` 
    - Store the generated Questions in the database, linked to the Session