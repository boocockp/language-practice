# Template Helpers

## Overview

The app needs to provide a number of Handlebars helpers so that the words selected by the data template can be used in the question or answer template to create correct grammatical sentences. These helpers will do things like selecting articles to agree with nouns and conjugating verbs. The sentence produced by the whole template must also take account of contractions expected in the target language, such as "la aile" to "l'aile" in French.

## Requirements

- All helpers used in the templates have a different implementation depending on the language of the question
- At this stage, only implement the helpers for a question language of French
- The final result of the handlebars template must be processed to contractions and/or elisions in the target language
- These helpers are available in the data template, question template, and answer template (one Handlebars instance is used for all steps, with all helpers registered).

## Initial helpers

### noun

Arguments:

| name | option | type        | description                                                                                                      |
| ---- | ------ | ----------- | :--------------------------------------------------------------------------------------------------------------- |
| word | no     | word object | the noun                                                                                                         |
| adj  | yes    | word object | the first adjective applied to the noun                                                                          |
| adj2 | yes    | word object | the second adjective applied to the noun                                                                         |
| art  | yes    | string      | The article used with the noun: 'def' for definite article, 'ind' for indefinite article. Default to no article. |
| num  | yes    | string      | The number of the noun: 'S' for singular, 'P' for plural. Default to singular.                                   |

Description:

Return a noun phrase using `word`, with the article and adjectives supplied. The article and adjectives (if any) must agree with the gender of the word and the number from `num`.

### verb

Arguments:

| name    | option | type        | description                                                                                     |
| ------- | ------ | ----------- | :---------------------------------------------------------------------------------------------- |
| word    | no     | word object | the verb                                                                                        |
| subject | no     | word object | the subject of the verb                                                                         |
| tense   | no     | string      | One of the supported tenses in https://rosaenlg.org/rosaenlg/4.4.0/mixins_ref/verbs_french.html |
| num     | yes    | string      | The number of the subject: 'S' for singular, 'P' for plural. Default to singular.               |

Description:

Return a conjugated verb using `word`, for the third person and number given, in the tense given, agreeing with the subject if necessary.

### translate

See **docs/features/Auto Translation.md** for full details.

- **Usage**: `{{translate someText}}` — one positional argument (the text to translate).
- **Direction**: From the question type language into the user's language (from the browser: `navigator.language`).
- **Availability**: The translate helper is only registered when the client passes `userLanguage` to the generate-question action. Implemented in `convex/templateHelpers.ts` via `createTranslateHelper`; translation is done by `convex/translation.ts` using the LibreTranslate API.

## Implementation notes

- **Approach**: The **verb** helper uses vendored `french-verbs` with a rule-based conjugation proxy (see docs/features/Verb conjugation.md). The **noun** helper uses vendored pluralize (French), vendored `french-adjectives`, and the word's type (nm/nf/nmf) for gender; no NlgLib. Post-process uses vendored `rosaenlg-filter` for French contractions and elisions (plus npm `titlecase-french`).
- **French only** for this stage. Helpers and post-process are registered only when the question language is French (`fr` → `fr_FR`).
- **Where**: Helpers are implemented in `convex/templateHelpers.ts`; `practiceActions.generateQuestion` registers them on the single async Handlebars instance used for both the data step and the question/answer step, so they are available in data, question, and answer templates.
- **Post-process**: The full rendered question and answer text are passed through the filter for French contractions and elisions (e.g. "la aile" → "l'aile").
- **Word type to gender**: `nm` → M, `nf` → F, `nmf` → M for noun/subject agreement.
- **Supported French tenses**: PRESENT, FUTUR, IMPARFAIT, PASSE_SIMPLE, PASSE_COMPOSE, PLUS_QUE_PARFAIT, CONDITIONNEL_PRESENT, SUBJONCTIF_PRESENT, IMPERATIF_PRESENT, INFINITIF, PARTICIPE_PRESENT, PARTICIPE_PASSE, etc. See https://rosaenlg.org/rosaenlg/4.4.0/mixins_ref/verbs_french.html

# Re-implementation of noun helper without NlgLib

## Overview

This is necessary because using NlgLib pulls in a large number of dependencies that make the bundle too large to run in Convex.
The implementation uses self-contained functions from RosaeNLG packages and is done in `convex/templateHelpers.ts` (no NlgLib).

## Requirements

- Create a noun-phrase for a given noun and number (and optional gender), with:
    - the correct singular/plural form of the noun
    - the correct gender for the noun OR the given gender
    - the correct determiner for the number and gender
    - up to two adjectives that agree with the number and gender
- Use the gender of the noun word-object supplied (word type nm/nf/nmf)
- Determine the plural form of the noun from rules
- Determine the correct form of the adjectives from rules for the number and gender
- Contraction of the definite article is not required as this is done in the post process stage of generating from the template
- Adjectives that come before the noun will be considered later

## Approach

- Use the function in `convex/lib/pluralizeFr.ts` (vendored from rosaenlg-pluralize-fr) to form the plural
- Use the function exported by vendored module `french-adjectives` to agree the adjectives
- Use the gender of the noun word-object supplied
- The determiner is chosen according to gender and number: le/la/les for the definite article, un/une/des for the indefinite article
- Concatenate the determiner, noun, adjective1 and adjective2 to return the result

## Later improvements

- Use getDet in 'french-determiners' to cover more situations
