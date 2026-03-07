/**
 * Conjugation table format for French verbs (VerbInfo).
 * Matches the format expected by french-verbs / RosaeNLG and the LEFFF tagset.
 * @see https://github.com/RosaeNLG/rosaenlg/blob/master/packages/french-verbs-lefff/resources/lefff-tagset-0.1.2.pdf
 */
export interface VerbInfo {
    /** Présent (6: 1s, 2s, 3s, 1p, 2p, 3p) */
    P: [string, string, string, string, string, string];
    /** Subjonctif présent (6) */
    S: [string, string, string, string, string, string];
    /** Impératif présent (6; "NA" where no form) */
    Y: [string, string, string, string, string, string];
    /** Imparfait (6) */
    I: [string, string, string, string, string, string];
    /** Participe présent (1) */
    G: [string];
    /** Participe passé (4: MS, MP, FS, FP) */
    K: [string, string, string, string];
    /** Passé simple (6) */
    J: [string, string, string, string, string, string];
    /** Subjonctif imparfait (6) */
    T: [string, string, string, string, string, string];
    /** Futur (6) */
    F: [string, string, string, string, string, string];
    /** Conditionnel présent (6) */
    C: [string, string, string, string, string, string];
    /** Infinitif (1) */
    W: [string];
}
