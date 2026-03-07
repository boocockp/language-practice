/**
 * Full regression test: every verb in conjugations.json must match the output
 * of our Proxy (irregular dict + regular rules). Loads the full conjugations
 * JSON only when this test file runs (Node/Vitest); not part of Convex bundle.
 */
// @vitest-environment node

import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import { createVerbLookupProxy } from "./verbLookupProxy";
import { irregularVerbs } from "./irregularVerbs";

const require = createRequire(import.meta.url);
const conjugations = require("french-verbs-lefff/dist/conjugations.json") as Record<string, Record<string, string[]>>;

const TENSE_KEYS = ["P", "S", "Y", "I", "G", "K", "J", "T", "F", "C", "W"] as const;

function getVerbsToCheck(): string[] {
    const out: string[] = [];
    for (const verb of Object.keys(conjugations)) {
        const ref = conjugations[verb];
        if (ref === null || typeof ref !== "object" || Object.keys(ref).length === 0) continue;
        if (verb === "avoir" || verb === "être" || verb === "uw" || verb === "uwSe") continue;
        out.push(verb);
    }
    return out;
}

describe("verb conjugation regression", () => {
    const proxy = createVerbLookupProxy(irregularVerbs);
    const verbs = getVerbsToCheck();

    it("has expected number of verbs from conjugations.json", () => {
        expect(verbs.length).toBeGreaterThan(7000);
    });

    it("every verb matches reference for all tense codes", () => {
        const mismatches: { verb: string; key: string; ref: string[]; got: string[] }[] = [];
        for (const verb of verbs) {
            const ref = conjugations[verb];
            const got = proxy[verb];
            if (!got) {
                mismatches.push({ verb, key: "*", ref: [], got: [] });
                continue;
            }
            for (const key of TENSE_KEYS) {
                const refArr = ref[key];
                const gotArr = got[key];
                if (!refArr || !gotArr) {
                    if (refArr !== gotArr)
                        mismatches.push({
                            verb,
                            key,
                            ref: refArr ?? [],
                            got: gotArr ?? [],
                        });
                    continue;
                }
                if (refArr.length !== gotArr.length || refArr.some((v, i) => v !== gotArr[i])) {
                    mismatches.push({ verb, key, ref: refArr, got: [...gotArr] });
                }
            }
        }
        expect(mismatches).toEqual([]);
    });
});
