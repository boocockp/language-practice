/**
 * Regular French verb conjugation rules for -er, -ir (finir type), and -re verbs.
 * Used to generate full VerbInfo when a verb is not in the irregular dictionary.
 *
 * Sources (multiple):
 * - https://en.wikipedia.org/wiki/French_conjugation
 * - https://www.frenchlearner.com/grammar/regular-verb-conjugation/
 * - https://www.frenchdictionary.com/guide/-er-ir-and-re-verbs-in-french
 * - french-verbs-lefff conjugations.json for exact form verification (parler, finir, vendre)
 */

import type { VerbInfo } from "./verbInfo";

export type VerbGroup = "er" | "ir" | "re";

/**
 * Detect verb group from infinitive. -ir is treated as 2nd group (finir type);
 * 3rd-group -ir verbs (e.g. courir, partir) will not match regular -ir rules and
 * should be in the irregular dictionary.
 */
export function getVerbGroup(infinitive: string): VerbGroup | null {
    if (typeof infinitive !== "string" || infinitive.length < 3) return null;
    if (infinitive.endsWith("er")) return "er";
    if (infinitive.endsWith("ir")) return "ir";
    if (infinitive.endsWith("re")) return "re";
    return null;
}

/**
 * Generate full VerbInfo for a regular -er verb (e.g. parler).
 * Stem = infinitive minus "er". No spelling adjustments (e.g. -cer, -ger);
 * mismatches are captured as irregulars by the build script.
 */
export function conjugateEr(infinitive: string): VerbInfo {
    const stem = infinitive.slice(0, -2);
    return {
        P: [stem + "e", stem + "es", stem + "e", stem + "ons", stem + "ez", stem + "ent"],
        S: [stem + "e", stem + "es", stem + "e", stem + "ions", stem + "iez", stem + "ent"],
        Y: ["NA", stem + "e", "NA", stem + "ons", stem + "ez", "NA"],
        I: [stem + "ais", stem + "ais", stem + "ait", stem + "ions", stem + "iez", stem + "aient"],
        G: [stem + "ant"],
        K: [stem + "é", stem + "és", stem + "ée", stem + "ées"],
        J: [stem + "ai", stem + "as", stem + "a", stem + "âmes", stem + "âtes", stem + "èrent"],
        T: [stem + "asse", stem + "asses", stem + "ât", stem + "assions", stem + "assiez", stem + "assent"],
        F: [stem + "erai", stem + "eras", stem + "era", stem + "erons", stem + "erez", stem + "eront"],
        C: [stem + "erais", stem + "erais", stem + "erait", stem + "erions", stem + "eriez", stem + "eraient"],
        W: [infinitive],
    };
}

/**
 * Generate full VerbInfo for a regular -ir verb (2nd group, finir type).
 * Stem = infinitive minus "ir"; present uses -is, -it, -issons, -issez, -issent.
 */
export function conjugateIr(infinitive: string): VerbInfo {
    const stem = infinitive.slice(0, -2);
    return {
        P: [stem + "is", stem + "is", stem + "it", stem + "issons", stem + "issez", stem + "issent"],
        S: [stem + "isse", stem + "isses", stem + "isse", stem + "issions", stem + "issiez", stem + "issent"],
        Y: ["NA", stem + "is", "NA", stem + "issons", stem + "issez", "NA"],
        I: [stem + "issais", stem + "issais", stem + "issait", stem + "issions", stem + "issiez", stem + "issaient"],
        G: [stem + "issant"],
        K: [stem + "i", stem + "is", stem + "ie", stem + "ies"],
        J: [stem + "is", stem + "is", stem + "it", stem + "îmes", stem + "îtes", stem + "irent"],
        T: [stem + "isse", stem + "isses", stem + "ît", stem + "issions", stem + "issiez", stem + "issent"],
        F: [stem + "irai", stem + "iras", stem + "ira", stem + "irons", stem + "irez", stem + "iront"],
        C: [stem + "irais", stem + "irais", stem + "irait", stem + "irions", stem + "iriez", stem + "iraient"],
        W: [infinitive],
    };
}

/**
 * Generate full VerbInfo for a regular -re verb (e.g. vendre).
 * Stem = infinitive minus "re". Present 3rd sg has no ending; passé simple in -is/-it/-îmes/-îtes/-irent.
 */
export function conjugateRe(infinitive: string): VerbInfo {
    const stem = infinitive.slice(0, -2);
    return {
        P: [stem + "s", stem + "s", stem, stem + "ons", stem + "ez", stem + "ent"],
        S: [stem + "e", stem + "es", stem + "e", stem + "ions", stem + "iez", stem + "ent"],
        Y: ["NA", stem + "s", "NA", stem + "ons", stem + "ez", "NA"],
        I: [stem + "ais", stem + "ais", stem + "ait", stem + "ions", stem + "iez", stem + "aient"],
        G: [stem + "ant"],
        K: [stem + "u", stem + "us", stem + "ue", stem + "ues"],
        J: [stem + "is", stem + "is", stem + "it", stem + "îmes", stem + "îtes", stem + "irent"],
        T: [stem + "isse", stem + "isses", stem + "ît", stem + "issions", stem + "issiez", stem + "issent"],
        F: [stem + "rai", stem + "ras", stem + "ra", stem + "rons", stem + "rez", stem + "ront"],
        C: [stem + "rais", stem + "rais", stem + "rait", stem + "rions", stem + "riez", stem + "raient"],
        W: [infinitive],
    };
}

export interface RegularRulesApi {
    getVerbGroup(infinitive: string): VerbGroup | null;
    conjugateEr(infinitive: string): VerbInfo;
    conjugateIr(infinitive: string): VerbInfo;
    conjugateRe(infinitive: string): VerbInfo;
}

/**
 * Generate VerbInfo for a verb if it is regular (-er, -ir, -re). Returns null if
 * the infinitive does not match a known regular group or is invalid.
 */
export function conjugateRegular(infinitive: string): VerbInfo | null {
    const group = getVerbGroup(infinitive);
    if (group === "er") return conjugateEr(infinitive);
    if (group === "ir") return conjugateIr(infinitive);
    if (group === "re") return conjugateRe(infinitive);
    return null;
}
