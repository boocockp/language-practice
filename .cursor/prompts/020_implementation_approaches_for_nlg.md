# Implementation approaches for NLG helper functions
_Exported on 02/03/2026 at 11:11:12 GMT from Cursor (2.5.26)_

---

**User**

Please advise on tapproaches for implementing the 2 helper functions described in @docs/features/Template Helpers.md .
Consider first implementing these helpers for French, but bear in mind that implementation for other European langauges will be required in the future.
The implementation of these requires the use of Natural Langugae Generation (NLG) techniques.
Consider only open source libraries in Javascript/Typescript.
The Rosaenlg library appears to be the most advanced currently.  The docs are at https://rosaenlg.org/rosaenlg/4.4.0/index.html . It is installed in node-modules for you to inspect the source code if needed. 
Please consider these approaches:
- Writing an NLG module from scratch incorporating all the rules of French grammar needed for these two functions
- Implementing the two functions as wrappers around rosaelng.  This may be difficult as it is intended to be used to produce html pages using the Pug library, and it is not designed for the language generation functions to be called directly
- Copying code from the internals of rosaenlg to create our own NLG library

BUT please also suggest other approaches that may be useful.


---

**Cursor**


Reviewing the Template Helpers spec and exploring RosaeNLG to recommend implementation approaches.



Inspecting RosaeNLG structure to determine how mixins are invoked:



Here is an advisory on implementing the `noun` and `verb` helpers.

---

# Implementation Advisory: Template Helpers (`noun` and `verb`)

## Summary of Requirements

From [Template Helpers.md](docs/features/Template%20Helpers.md):

1. **`noun` helper**  
   Noun phrase with article and adjectives agreeing in gender and number.  
   Inputs: word (noun), optional adj, adj2, art (`def`|`ind`), num (`S`|`P`).

2. **`verb` helper**  
   Conjugated verb for third person, agreeing with the subject.  
   Inputs: word (verb), subject (word), tense, optional num (`S`|`P`).

Both need French elision/contraction (e.g. *la aile* → *l'aile*).

---

## Approach 1: RosaeNLG Wrapper (Recommended)

**Finding:** RosaeNLG’s core logic can be used without Pug templates.

The `rosaenlg-lib` package exposes `NlgLib`, which owns:

- **ValueManager** – nominal groups, articles, adjective agreement
- **VerbsManager** – conjugation
- **Spy** – output buffer
- **getFiltered()** – applies language-specific filters (e.g. French contractions)

`NlgLib` creates a `SpyNoPug()` by default, so you can call these managers programmatically.

### Noun helper

```ts
// Pseudocode
function nounHelper(word: Word, options: { adj?, adj2?, art?, num? }): string {
  const nlg = getNlgLib('fr_FR'); // cached per language
  nlg.spy.setPugHtml('');
  const params: ValueParams = {
    det: options.art === 'def' ? 'DEFINITE' : options.art === 'ind' ? 'INDEFINITE' : undefined,
    number: (options.num ?? 'S') === 'P' ? 'P' : 'S',
  };
  if (options.adj) params.adj = options.adj.text;
  if (options.adj2) params.adj = [params.adj, options.adj2.text].filter(Boolean);
  nlg.valueManager.value(word.text, params);
  return nlg.getFiltered();
}
```

### Verb helper

`VerbsManager.getAgreeVerb()` returns a string. You must pass a subject the `GenderNumberManager` can interpret (string or anonymous object with gender/number):

```ts
// Pseudocode
function verbHelper(verbWord: Word, subjectWord: Word, tense: string, num?: 'S'|'P'): string {
  const nlg = getNlgLib('fr_FR');
  const subject = nlg.genderNumberManager.getAnonymous(
    wordTypeToGender(subjectWord.type),  // nm->'M', nf->'F', nmf->'M' (or dict)
    num ?? 'S'
  );
  return nlg.verbsManager.getAgreeVerb(
    subject,
    num === 'P' ? '3P' : '3S',
    { verb: verbWord.text, tense },
    {}
  );
}
```

### Practical considerations

- **Per-language `NlgLib`** – `NlgLib` is created with a `language` (e.g. `'fr_FR'`), so use a lazy cache of one instance per language.
- **Convex compatibility** – `rosaenlg-lib` uses Node APIs and may not run in Convex’s default runtime. Options:
  - Run helpers in a Convex action with `"use node"`.
  - Pre-render on the client and send only rendered strings to Convex.
- **Embedded linguistic resources** – For verbs not in the default set, you can call `nlg.setEmbeddedVerbs(...)` with custom verb data.
- **`nmf`** – For words with same masculine/feminine form, either choose a default (e.g. `'M'`) or derive from context/dictionary.

---

## Approach 2: Underlying RosaeNLG Packages

RosaeNLG splits grammar into separate npm packages:

| Package              | Purpose                 | Standalone?                     |
|----------------------|-------------------------|---------------------------------|
| `french-determiners` | le/la/l'/un/une/des…   | Yes                             |
| `french-verbs`       | Conjugation             | Yes                             |
| `french-adjectives-wrapper` | Agreement        | Yes                             |
| `french-words`       | Gender lookup           | Yes                             |
| `french-contractions`| Elision (la→l')         | Yes                             |

You could wire these directly:

- Pros: Smaller footprint, no Pug, more control.
- Cons: You must reimplement the orchestration that `ValueManager` and `VerbsManager` provide (order of operations, edge cases, buffer handling).

---

## Approach 3: NLG from Scratch

You would need rules for:

- Articles: definite/indefinite, gender, number, elision.
- Adjectives: position (before/after), agreement (e.g. *beau/belle/beaux/belles*), irregulars.
- Nouns: pluralisation (e.g. *-al→-aux*).
- Verbs: all tenses, auxiliaries (avoir/être), participle agreement.

Even a basic implementation would be large and error-prone. Existing work (e.g. Verbiste, Lefff) is covered by RosaeNLG’s stack, so this is not recommended unless you have strict constraints.

---

## Approach 4: Fork or Copy RosaeNLG Internals

RosaeNLG is Apache 2.0, so copying is allowed, but:

- Code is tightly coupled (`ValueManager`, `GenderNumberManager`, `Helper`, etc.).
- You would have to:
  - Extract the parts you need.
  - Maintain updates and bug fixes.
  - Recreate the integration logic.

This is only worth considering if you must remove Pug and cannot use the wrapper or underlying packages.

---

## Approach 5: Alternative NLG Libraries

Alternatives in JS/TS:

- **conjugation-fr** (Node, GPL-2.0): Conjugation only; no nominal groups. GPL is restrictive.
- **french-verbs** (standalone): Same engine as RosaeNLG; useful if you only need verbs.

There is no obvious alternative that matches RosaeNLG’s coverage for French nominal groups and verbs.

---

## Multi-Language Design

RosaeNLG supports:

- French: `fr_FR`
- English: `en_US`
- German: `de_DE`
- Italian: `it_IT`
- Spanish: `es_ES`

Use a language registry:

```ts
type SupportedLocale = 'fr_FR' | 'en_US' | 'de_DE' | 'it_IT' | 'es_ES';

const nlgCache = new Map<SupportedLocale, NlgLib>();

function getNlgLib(locale: SupportedLocale): NlgLib {
  if (!nlgCache.has(locale)) {
    nlgCache.set(locale, new NlgLib({ language: locale, renderDebug: false }));
  }
  return nlgCache.get(locale)!;
}
```

Map your app’s `language` codes (e.g. `'fr'`, `'en'`) to these locales.

---

## Recommended Path

1. **Phase 1 (French):** Implement a RosaeNLG wrapper using `NlgLib`, `ValueManager`, and `VerbsManager` as above. Run it in a Convex `"use node"` action (or client-side if Convex runtime is an issue).
2. **Phase 2 (other languages):** Add `en_US`, `de_DE`, etc. and a small abstraction so your helpers are language-agnostic:

   ```ts
   type NounHelper = (word, opts) => string;
   type VerbHelper = (verb, subject, tense, num?) => string;
   const helpers: Record<SupportedLocale, { noun: NounHelper; verb: VerbHelper }> = { ... };
   ```

3. **Phase 3 (optional):** If the RosaeNLG footprint or Pug dependency becomes a problem, evaluate using `french-determiners`, `french-verbs`, and `french-contractions` directly for a thinner stack.

---

## Quick Reference: RosaeNLG API

| Component            | Method                 | Returns       | Notes                                      |
|---------------------|------------------------|---------------|--------------------------------------------|
| `ValueManager`      | `value(noun, params)`  | void (buffer) | `params`: `det`, `adj`, `number`, `adjPos` |
| `VerbsManager`      | `getAgreeVerb(subj, person, conjParams, addl)` | string | `person`: `'3S'`/`'3P'`; `conjParams`: `{ verb, tense }` |
| `GenderNumberManager` | `getAnonymous('M'\|'F','S'\|'P')` | object | Use as subject for agreement                |
| `NlgLib`            | `getFiltered()`        | string        | Post-processes buffer (e.g. contractions)   |

Relevant docs: [Value for Nominal Groups](https://rosaenlg.org/rosaenlg/4.4.0/mixins_ref/value_nominal_groups.html), [French Verbs](https://rosaenlg.org/rosaenlg/4.4.0/mixins_ref/verbs_french.html).

