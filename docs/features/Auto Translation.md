User Feature: Auto Translation
==============================

Overview
--------

In Question Type templates, the user can use a helper that translates a given text into the user's own language.
This will enable questions that ask the user to translate sentences to or from the target language.
Translation is done by an API call to a translation service, which will be Libretranslate initially, but may change in the future

Requirements
------------

- New helper: translate <text>
- The translation is from the language of the Question Type into the user's language
- Get the user's language from the language of the browser (We may introduce a user profile with preferred language later)

Implementation
--------------

- **Helper**: `{{translate someText}}` in data, question, or answer templates. One positional argument (the text to translate).
- **Direction**: From the question type language (e.g. French) into the user's language. User language is taken from `navigator.language` on the client and passed as `userLanguage` when generating a question.
- **Registration**: The translate helper is only registered when the client passes a non-empty `userLanguage` to the generate-question action. If a template uses `{{translate ...}}` and `userLanguage` is not provided, question generation will fail (helper not registered).

Technical Notes
---------------

- Structure the translation code into a self-contained area of code with an interface with arguments for text, from language, to language
- Use a Libretranslate API, which may be the public service or a self-hosted one
- Use the translate wrapper library described here: https://github.com/franciscop/translate
- Use environment variables for the libretranslate url and the api key

**Convex environment variables** (set in Convex dashboard or via `npx convex env set`):

- `LIBRETRANSLATE_URL` (optional): LibreTranslate API base URL. Default: `https://libretranslate.com`. Use this for a self-hosted instance.
- `LIBRETRANSLATE_API_KEY` (optional): API key for the LibreTranslate service (required by some public or self-hosted instances).

**Code locations**:

- `convex/translation.ts`: Self-contained translation module; `createTranslator(config?)` returns a function `(text, from, to) => Promise<string>`. Uses the `translate` npm package with engine `libre`.
- `convex/templateHelpers.ts`: `createTranslateHelper(fromLang, toLang, translateFn)` creates the Handlebars helper. The action in `convex/practiceActions.ts` merges this helper into template helpers when `userLanguage` is provided.
