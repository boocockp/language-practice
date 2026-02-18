Feature: Current Language
=========================

Overview
--------

Although a user may study more than one language in the app, it is assumed that they will only study one language at any one time

Requirements
------------

- On each page where they have the app open, the user can select which of the available languages they are studying.
- The selection is made by a dropdown at the right hand side of the nav bar
- The dropdown labels are the name of the language, in that language
- The dropdown values are the two-letter ISO 639 codes for the language
- The current choices are: 
    'fr': French
    'en': English
- The choice applies to each browser window/tab separately, so the user may have the app open in multiple tabs with each set to a different language
- The user sees only data records where the `language` field is the same as the current language code

Technical notes
---------------

- The selected language code should be made available throughout the client app by using a React context
- Most database queries and server function calls will need to include the language code
- Client code can obtain the name of the language, given the code, using a global function 

