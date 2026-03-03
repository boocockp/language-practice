---
name: Verb conjugation rule-based
overview: "Replace the large in-memory French conjugation dictionary with a rule-based approach: a Proxy that uses regular-verb rules for -er/-ir/-re and an irregular-verb dictionary (built from conjugations.json by a one-off script), and ensure Convex never loads the full conjugations.json."
todos: []
isProject: false
---

# Verb conjugation: rule-based implementation

## Goal

Make French verb conjugation work in Convex by avoiding the ~6MB `french-verbs-lefff/dist/conjugations.json` load. Use **regular-verb rules** for -er, -ir, -re and an **irregular-verb dictionary**; keep using `nlg.verbsManager.getAgreeVerb` with a replacement lookup provided via `setEmbeddedVerbs`.

## Critical constraint: when the big file is loaded

In [node_modules/rosaenlg-lib/dist/LanguageFrench.js](node_modules/rosaenlg-lib/dist/LanguageFrench.js), line 17:

```js
const conjugations_json_1 = __importDefault(require("french-verbs-lefff/dist/conjugations.json"));
```

This runs at **module load time**. So as soon as `getNlgLib('fr_FR')` causes `LanguageFrench` to load, the 6MB JSON is loaded regardless of `setEmbeddedVerbs`. Therefore we must **prevent that default import from loading the real file** (e.g. stub at build time or patch the dependency). The plan leaves the exact mechanism to be decided during implementation after checking Convex’s bundling (see “Avoid loading default conjugations” below).

## Data flow (target)

- [convex/templateHelpers.ts](convex/templateHelpers.ts): when creating `NlgLib` for `fr_FR`, call `nlg.verbsManager.setEmbeddedVerbs(createVerbLookupProxy(irregulars, regularRules))`.
- **Verb lookup Proxy**: behaves like `VerbsInfo` (object whose keys are verb names). On `proxy[verb]`:
  - If `verb` is in the **irregular dictionary**, return that conjugation table.
  - Else return a table **computed from regular rules** (-er, -ir, -re) from the infinitive.
- **french-verbs** (used inside RosaeNLG) calls `getVerbInfo(verbsList, verb)` where `verbsList` is our proxy; it only does `verbsList[verb]`. So the Proxy need only implement property get (and avoid being used in ways that require enumeration of all verbs).

## Conjugation table format (VerbInfo)

Same as Lefff/RosaeNLG. Reference: [docs/features/Verb conjugation.md](docs/features/Verb%20conjugation.md) and [stuff/parler.json](stuff/parler.json).

- **P** = présent (6 forms); **S** = subjonctif présent (6); **Y** = impératif présent (6, "NA" where no form); **I** = imparfait (6); **J** = passé simple (6); **T** = subjonctif imparfait (6); **F** = futur (6); **C** = conditionnel présent (6).
- **G** = participe présent (1); **W** = infinitif (1); **K** = participe passé (4: MS, MP, FS, FP).

Tense mapping used by `french-verbs` (from [node_modules/french-verbs/dist/index.js](node_modules/french-verbs/dist/index.js)): PRESENT→P, IMPARFAIT→I, FUTUR→F, PASSE_SIMPLE→J, CONDITIONNEL_PRESENT→C, IMPERATIF_PRESENT→Y, SUBJONCTIF_PRESENT→S, SUBJONCTIF_IMPARFAIT→T, PARTICIPE_PRESENT→G, PARTICIPE_PASSE→K, INFINITIF→W.

## Implementation steps

### 1. Avoid loading default conjugations in Convex

- **Verify**: Run Convex dev/deploy and confirm that importing `templateHelpers` / `NlgLib` for French triggers the load of `french-verbs-lefff/dist/conjugations.json` (and where it fails or hangs).
- **Choose approach** based on how Convex bundles `node_modules`:
  - If Convex uses a bundler that can replace modules: add a substitution so `french-verbs-lefff/dist/conjugations.json` (or the `LanguageFrench` require of it) resolves to a tiny stub `{}`. Then we **always** call `setEmbeddedVerbs(proxy)` for French so no code path needs the real file at runtime.
  - If no substitution is feasible: use **patch-package** to patch `rosaenlg-lib` (or the chain that imports the JSON) so that the conjugations import is either lazy or stubbed (e.g. export empty object by default).
- **Result**: When French NLG runs in Convex, only our Proxy + irregular dictionary + rule-generated tables are used; the 6MB JSON is never loaded.

### 2. Regular verb rules (separate file)

- **Location**: e.g. `convex/frenchConjugation/regularVerbRules.ts` (or under `convex/` as you prefer).
- **Content**: Pure functions that, given an **infinitive** and a **group** (-er, -ir, -re), return a full `VerbInfo` (P, S, Y, I, J, T, F, C, G, K, W).
- **Sources**: Use multiple French grammar sources (e.g. [French conjugation (Wikipedia)](https://en.wikipedia.org/wiki/French_conjugation), [French regular verb conjugation](https://www.frenchlearner.com/grammar/regular-verb-conjugation/), and any other references). Document sources and rules in the file or in `docs/` (e.g. `docs/features/Verb conjugation.md` or a short `docs/features/French-verb-rules-sources.md`).
- **Rules to implement**:
  - **-er**: stem = infinitive minus "er". Present: e, es, e, ons, ez, ent. Imperfect: stem + ais, ais, ait, ions, iez, aient. Future: stem + erai, eras, era, erons, erez, eront. Conditional: stem + erais, … Subjunctive present: e, es, e, ions, iez, ent. Subjunctive imperfect: stem + asse, asses, ât, assions, assiez, assent. Passé simple: stem + ai, as, a, âmes, âtes, èrent. Imperative: NA, e, NA, ons, ez, NA. Participle present: stem + ant. Past participle: stem + é (then K: é, és, ée, ées). Infinitive: return as-is.
  - **-ir (finir-type)**: stem = infinitive minus "ir". Present: is, is, it, issons, issez, issent. Imperfect: stem + issais, … Future: stem + irai, … etc. (Standard 2nd-group pattern; document exact endings from sources.)
  - **-re**: stem = infinitive minus "re". Present: s, s, -, ons, ez, ent (3rd sg no ending). Imperfect: stem + ais, … Future: stem + rai, ras, ra, rons, rez, ront. etc. (Document sources.)
- **Spelling adjustments**: -er verbs with stem ending in ç, g, c may need special handling (e.g. manger → nous mangeons). Start with the most common patterns; mismatches with Lefff will be captured in the irregular dictionary by the script in step 4.
- **Detection of group**: From infinitive: if ends with "er" → -er; "ir" → -ir (treat as 2nd group by default; 3rd-group -ir like courir will fail rules and go to irregular); "re" → -re.

### 3. Irregular verb dictionary and Proxy (separate files)

- **Irregular dictionary**: e.g. `convex/frenchConjugation/irregularVerbs.ts` (or `.json` if we want to load it once). Type: `Record<string, VerbInfo>`. Initially **empty**.
- **VerbInfo type**: Define (or import from rosaenlg if available) an interface matching P, S, Y, I, J, T, F, C, G, K, W as above.
- **Proxy**: e.g. `convex/frenchConjugation/verbLookupProxy.ts`. Export a function `createVerbLookupProxy(irregularDict: Record<string, VerbInfo>, regularRules: RegularRulesApi)`. Return a **Proxy** that:
  - On `get(target, verb)`: if `verb` in `irregularDict`, return `irregularDict[verb]`; else compute `VerbInfo` from `regularRules` from the infinitive `verb` and return it (or throw/return undefined if not a known regular pattern).
  - Do not require `has`/enumeration to list all verbs; only `get` is used by `getVerbInfo(verbsList, verb)`.

### 4. Wire NlgLib to the Proxy in templateHelpers

- In [convex/templateHelpers.ts](convex/templateHelpers.ts), inside `getNlgLib(locale)` (or only when `locale === 'fr_FR'`):
  - Build or import the irregular dictionary and the regular-rules module.
  - Create the verb lookup Proxy and call `nlg.verbsManager.setEmbeddedVerbs(proxy)` immediately after constructing `NlgLib`.
- Keep the rest of the verb helper unchanged (still uses `getAgreeVerb`).

### 5. One-off script: build irregular dictionary from conjugations.json

- **Location**: e.g. `scripts/buildIrregularVerbs.mjs` (or `.ts` run with ts-node).
- **Input**: `node_modules/french-verbs-lefff/dist/conjugations.json` (read from filesystem; script runs in Node with sufficient memory, not in Convex).
- **Logic**: For each verb in the JSON:
  - Compute the conjugation table using the **regular verb rules** (same code as in convex, or shared via a small package).
  - If the computed table does **not** match the table in conjugations.json (deep equality per key), add the **original** conjugations.json entry to the irregular dictionary.
- **Output**: Write the irregular dictionary to a file that the Convex code can import, e.g. `convex/frenchConjugation/irregularVerbsData.json` (or generate `irregularVerbs.ts` that exports the object). Run this script during development / when updating sources; commit the generated file.
- **Note**: "avoir" and "être" are handled inside `french-verbs.getVerbInfo` before the verbs list is used, so they need not be in the irregular dictionary.

### 6. Full regression test against conjugations.json

- **Location**: e.g. `convex/frenchConjugation/verbConjugation.test.ts` or a script in `scripts/`.
- **Setup**: Load conjugations.json (only in Node/test environment, not in Convex). Create the Proxy with the built irregular dictionary and the regular rules.
- **Test**: For every verb in conjugations.json, for each tense code (P, S, Y, I, J, T, F, C, G, K, W), compare the form(s) returned by the Proxy with the form(s) in conjugations.json. All must match.
- **Execution**: This test can be excluded from Convex (or run only in Vitest with `conjugations.json` available). Ensure `npm run test` or CI does not load the 6MB file in the Convex bundle.

### 7. Documentation

- Update [docs/features/Verb conjugation.md](docs/features/Verb%20conjugation.md) with: approach (Proxy + rules + irregular dict), location of rules and script, how to regenerate the irregular dictionary, and reference to the LEFFF tagset PDF for code letters.
- Add a short note on grammar sources (multiple) and where they are documented (in the regular-rules file or `docs/`).
- If you introduced a patch or build substitution, document it in [AGENTS.md](AGENTS.md) or a small “Convex / deployment” section in the doc.

## Dependencies and risks

- **RosaeNLG API**: Confirmed that [VerbsManager](node_modules/rosaenlg-lib/dist/VerbsManager.js) has `setEmbeddedVerbs(embeddedVerbs)` and passes it to `languageImpl.getConjugation(..., this.embeddedVerbs, ...)`. [LanguageFrench.getConjugation](node_modules/rosaenlg-lib/dist/LanguageFrench.js) uses `embeddedVerbs || conjugations_json_1.default`, so once we stub the default, we rely entirely on our Proxy.
- **Memory**: Irregular dictionary size: after building from conjugations.json, measure file size and in-memory usage; it should be much smaller than 6MB because only irregulars are stored.
- **Spelling variants**: Some -er/-ir/-re verbs have orthographic changes (e.g. -cer, -ger, doubling consonants). The script in step 5 will correctly mark them as irregular and store their full table; we can extend rules later for common subtypes if desired.

## Order of work

1. Implement regular verb rules + VerbInfo type + Proxy (steps 2, 3) in a way that does **not** depend on Convex yet (plain TS under convex/ or a shared folder).
2. Implement the script that builds the irregular dictionary from conjugations.json (step 5); run it and commit the generated irregular data.
3. Integrate the Proxy into templateHelpers and call setEmbeddedVerbs (step 4).
4. Resolve the default conjugations load (step 1): verify Convex bundling, then apply patch or build substitution so the 6MB file is never loaded.
5. Add the full regression test (step 6) and run it in Node/Vitest.
6. Update docs (step 7).

## Optional later improvements

- Support more regular subtypes (e.g. -cer, -ger) in rules to shrink the irregular list.
- Lazy-load the irregular dictionary in Convex if it is still large (e.g. load from a Convex file or HTTP resource on first use).
