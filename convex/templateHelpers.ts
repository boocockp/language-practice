"use node";

import type Handlebars from "handlebars";

/// <reference path="./rosaenlg-pluralize-fr.d.ts" />
import { agree } from "french-adjectives";
import { createVerbLookupProxy, irregularVerbs } from "./frenchConjugation";
import FrenchVerbs from "french-verbs";
import type { Tense } from "french-verbs";
import { LanguageCommonFrench } from "rosaenlg-commons";
import { filter } from "rosaenlg-filter";
import pluralizeFr from "rosaenlg-pluralize-fr";

const verbLookup = createVerbLookupProxy(irregularVerbs);
const langCommon = new LanguageCommonFrench();
langCommon.init();

/** Map app language to RosaeNLG locale */
function toNlgLocale(language: string): string {
  const map: Record<string, string> = {
    fr: "fr_FR",
    en: "en_US",
    de: "de_DE",
    it: "it_IT",
    es: "es_ES",
  };
  return map[language] ?? language;
}

/** Map WordType to RosaeNLG gender for noun/subject agreement */
function wordTypeToGender(type: string | undefined): "M" | "F" | "N" {
  switch (type) {
    case "nm":
      return "M";
    case "nf":
      return "F";
    case "nmf":
      return "M";
    default:
      return "M";
  }
}

type GendersMF = "M" | "F";

/** Determiner for French: def → le/la/les, ind → un/une/des, otherwise "". */
function getDeterminer(
  gender: GendersMF,
  number: "S" | "P",
  art: string | undefined
): string {
  if (art === "def") {
    if (number === "P") return "les";
    return gender === "F" ? "la" : "le";
  }
  if (art === "ind") {
    if (number === "P") return "des";
    return gender === "F" ? "une" : "un";
  }
  return "";
}

type WordObj = { text: string; type?: string; meaning?: string } | null;

function createNounHelper(_locale: string): Handlebars.HelperDelegate {
  return function (this: unknown, options: Handlebars.HelperOptions) {
    const hash = options.hash ?? {};
    const word = hash.word as WordObj;
    if (!word || typeof word.text !== "string") return "";

    const adj = hash.adj as WordObj | undefined;
    const adj2 = hash.adj2 as WordObj | undefined;
    const art = hash.art as string | undefined;
    const num = hash.num as string | undefined;

    const g = wordTypeToGender(word.type);
    const gender: GendersMF = g === "N" ? "M" : g;
    const number = num === "P" ? "P" : "S";
    const nounText = word.text;
    const nounForm = number === "P" ? pluralizeFr(nounText) : nounText;
    const det = getDeterminer(gender, number, art);

    const adjTexts = [adj?.text, adj2?.text].filter(
      (t): t is string => typeof t === "string" && t !== ""
    );
    const agreedAdjs = adjTexts.map((adjText) =>
      agree(adjText, gender, number, nounText, false, undefined)
    );
    const phraseParts = [det, nounForm, ...agreedAdjs].filter(Boolean);
    return phraseParts.join(" ");
  };
}

function createVerbHelper(_locale: string): Handlebars.HelperDelegate {
  return function (this: unknown, options: Handlebars.HelperOptions) {
    const hash = options.hash ?? {};
    const word = hash.word as WordObj;
    const subject = hash.subject as WordObj;
    const tense = hash.tense as string | undefined;
    const num = hash.num as string | undefined;

    if (!word || typeof word.text !== "string") return "";
    if (!subject || typeof subject.text !== "string") return "";
    if (!tense || typeof tense !== "string") return "";

    const number = num === "P" ? "P" : "S";
    const personIndex = number === "P" ? 5 : 2;

    return FrenchVerbs.getConjugation(verbLookup, word.text, tense as Tense, personIndex, {}, false, undefined, undefined, 'Act')
  };
}

function createPostProcess(_locale: string): (text: string) => string {
  return text => filter(text, langCommon, {});
}

/**
 * Returns Handlebars template helpers and postProcess for the given language.
 * French (fr) gets noun/verb helpers and postProcess; other languages get undefined.
 */
export function getTemplateHelpersForLanguage(language: string): {
  templateHelpers: Record<string, Handlebars.HelperDelegate> | undefined;
  postProcess: ((text: string) => string) | undefined;
} {
  const locale = toNlgLocale(language);
  if (locale !== "fr_FR") {
    return { templateHelpers: undefined, postProcess: undefined };
  }
  return {
    templateHelpers: {
      noun: createNounHelper(locale),
      verb: createVerbHelper(locale),
    },
    postProcess: createPostProcess(locale),
  };
}
