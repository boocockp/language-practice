Template Helpers
================

Overview
--------

The app needs to provide a number of Handlebars helpers so that the words selected by the data template can be used in the question or answer template to create correct grammatical sentences.  These helpers will do things like selecting articles to agree with nouns and conjugating verbs.  The sentence produced by the whole template must also take account of contractions expected in the target language, such as "la aile" to "l'aile" in French.

Requirements
------------

- All helpers used in the templates have a different implementation depending on the language of the question
- At this stage, only implement the helpers for a question language of French
- The final result of the handlebars template must be processed to contractions and/or elisions in the target language
- These helpers are only available in the question and answer templates, not in the data template

Initial helpers
---------------

### noun

Arguments:


| name | option | type        | description                                                                                                       |
| ------ | -------- | ------------- | :------------------------------------------------------------------------------------------------------------------ |
| word | no     | word object | the noun                                                                                                          |
| adj  | yes    | word object | the first adjective applied to the noun                                                                           |
| adj2 | yes    | word object | the second adjective applied to the noun                                                                          |
| art  | yes    | string      | The article used with the noun: 'def' for definite article, 'ind' for indefinite article.  Default to no article. |
| num  | yes    | string      | The number of the noun: 'S' for singular, 'P' for plural.  Default to singular.                                   |

Description:

Return a noun phrase using `word`, with the article and adjectives supplied.  The article and adjectives (if any) must agree with the gender of the word and the number from `num`.

### verb

Arguments:


| name    | option | type        | description                                                                                     |
| --------- | -------- | ------------- | :------------------------------------------------------------------------------------------------ |
| word    | no     | word object | the verb                                                                                        |
| subject | no     | word object | the subject of the verb                                                                         |
| tense   | no     | string      | One of the supported tenses in https://rosaenlg.org/rosaenlg/4.4.0/mixins_ref/verbs_french.html |
| num     | yes    | string      | The number of the subject: 'S' for singular, 'P' for plural.  Default to singular.              |

Description:

Return a conjugated verb using `word`, for the third person and number given, in the tense given, agreeing with the subject if necessary.

Implementation notes
--------------------

- **Approach**: RosaeNLG wrapper (Approach 1). The helpers wrap `rosaenlg-lib`'s `NlgLib`, `ValueManager`, and `VerbsManager`; no Pug templates.
- **French only** for this stage. Helpers and post-process are registered only when the question language is French (`fr` → `fr_FR`).
- **Where**: Implemented in `convex/practiceActions.ts`; registered in the question/answer template step (not the data step).
- **Post-process**: The full rendered question and answer text are passed through `getFiltered()` for French contractions and elisions (e.g. "la aile" → "l'aile").
- **Word type to gender**: `nm` → M, `nf` → F, `nmf` → M for noun/subject agreement.
- **Supported French tenses** (RosaeNLG): PRESENT, FUTUR, IMPARFAIT, PASSE_SIMPLE, PASSE_COMPOSE, PLUS_QUE_PARFAIT, CONDITIONNEL_PRESENT, SUBJONCTIF_PRESENT, IMPERATIF_PRESENT, INFINITIF, PARTICIPE_PRESENT, PARTICIPE_PASSE, etc. See https://rosaenlg.org/rosaenlg/4.4.0/mixins_ref/verbs_french.html
