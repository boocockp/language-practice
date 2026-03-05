User Feature: Auto Translation
==============================

Overview
--------

When defining a Question Type, the user can use a translation of either the Question or the Answer, into the user's own language, in the other template.
This will enable questions that ask the user to translate sentences to or from the target language.
Translation is done by an API call to a translation service, which will be Libretranslate initially, but may change in the future

Requirements
------------

- Two new helpers: translateQuestion and translateAnswer (no arguments)
- Question Type has two extra boolean fields: Translate Question and Translate Answer.
- Show these on the UI as checkboxes below the Question Template and Answer Template fields respectively
- The Question Template and Answer Template are always written in the Question language
- When a Question is generated, after generating the text and expected, call the translation service for either of the two fields if they are marked as to be translated
- The translation is from the language of the Question Type into the user's language
- Get the user's language from the language of the browser

Technical Notes
---------------

- Structure the translation code into a self-contained area of code with an interface with arguments for text, from language, to language
- Use a Libretranslate API, which may be the public service or a self-hosted one
- Use the translate wrapper library described here: https://github.com/franciscop/translate
- Use environment variables for the libretranslate url and the api key

Examples
--------

### Translate into own language

Question: What does {{}}

### Translate into own language