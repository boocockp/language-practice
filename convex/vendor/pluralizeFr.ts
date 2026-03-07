/**
 * French pluralization for nouns.
 * Vendored from rosaenlg/packages/rosaenlg-pluralize-fr (MIT / same author as RosaeNLG).
 */

function agreeSingleWord(str: string): string {
    const euAuWithS = [
        "bleu",
        "émeu",
        "landau",
        "pneu",
        "sarrau",
        "beu",
        "bisteu",
        "enfeu",
        "eu",
        "neuneu",
        "rebeu",
        "restau",
    ];
    const ouWithX = [
        "bijou",
        "chou",
        "genou",
        "caillou",
        "hibou",
        "joujou",
        "pou",
        "ripou",
        "chouchou",
        "boutchou",
    ];
    const ailToAux = [
        "bail",
        "corail",
        "émail",
        "gemmail",
        "soupirail",
        "travail",
        "vantail",
        "vitrail",
    ];
    const alWithS = [
        "aval",
        "bal",
        "banal",
        "bancal",
        "cal",
        "carnaval",
        "cérémonial",
        "choral",
        "étal",
        "fatal",
        "festival",
        "natal",
        "naval",
        "pal",
        "récital",
        "régal",
        "tonal",
        "val",
        "virginal",
        "chacal",
        "serval",
    ];
    const exceptions: Record<string, string> = {
        ail: "aulx",
        oeil: "yeux",
        œil: "yeux",
    };

    const lastLetter = str[str.length - 1];
    const last2Letters = str.slice(-2);
    const last3Letters = str.slice(-3);

    if (exceptions[str]) {
        return exceptions[str];
    }
    if (lastLetter === "s" || lastLetter === "z" || lastLetter === "x") {
        return str;
    }
    if (last2Letters === "au" || last2Letters === "eu") {
        return euAuWithS.includes(str) ? str + "s" : str + "x";
    }
    if (last2Letters === "ou") {
        return ouWithX.includes(str) ? str + "x" : str + "s";
    }
    if (last3Letters === "ail") {
        if (ailToAux.includes(str)) {
            const radical = str.substring(0, str.length - 3);
            return radical + "aux";
        }
        return str + "s";
    }
    if (last2Letters === "al") {
        return alWithS.includes(str) ? str + "s" : str.slice(0, -2) + "aux";
    }
    return str + "s";
}

/**
 * Returns the plural form of a French noun (or multi-word phrase like "machine à laver").
 */
export function pluralizeFr(fullStr: string): string {
    const strings = fullStr.split(" ");

    if (strings.length === 1) {
        return agreeSingleWord(strings[0]);
    }
    if (strings.length > 1 && strings[1] === "à") {
        return agreeSingleWord(strings[0]) + " " + strings.slice(1).join(" ");
    }
    return strings.map((s) => agreeSingleWord(s)).join(" ");
}
