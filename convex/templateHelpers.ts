"use node";

import type Handlebars from "handlebars";
// import { NlgLib } from "rosaenlg-lib";

import { createVerbLookupProxy, irregularVerbs } from "./frenchConjugation";
import FrenchVerbs, { Tense } from 'french-verbs'

const verbLookup = createVerbLookupProxy(irregularVerbs);

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

// const nlgCache = new Map<string, NlgLib>();

// function getNlgLib(locale: string): NlgLib {
//   let nlg = nlgCache.get(locale);
//   if (!nlg) {
//     nlg = new NlgLib({ language: locale, renderDebug: false });
//     if (locale === "fr_FR") {
//       nlg.verbsManager.setEmbeddedVerbs(createVerbLookupProxy(irregularVerbs));
//     }
//     nlgCache.set(locale, nlg);
//   }
//   return nlg;
// }

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

type WordObj = { text: string; type?: string; meaning?: string } | null;

function createNounHelper(locale: string): Handlebars.HelperDelegate {
  return function (this: unknown, options: Handlebars.HelperOptions) {
    return "noun helper";
  };
  // const nlg = getNlgLib(locale);
  // return function (this: unknown, options: Handlebars.HelperOptions) {
  //   const hash = options.hash ?? {};
  //   const word = hash.word as WordObj;
  //   if (!word || typeof word.text !== "string") return "";

  //   const adj = hash.adj as WordObj | undefined;
  //   const adj2 = hash.adj2 as WordObj | undefined;
  //   const art = hash.art as string | undefined;
  //   const num = hash.num as string | undefined;

  //   const params: Record<string, unknown> = {
  //     number: num === "P" ? "P" : "S",
  //     gender: wordTypeToGender(word.type),
  //   };

  //   if (art === "def") params.det = "DEFINITE";
  //   else if (art === "ind") params.det = "INDEFINITE";

  //   const adjTexts = [adj?.text, adj2?.text].filter(
  //     (t): t is string => typeof t === "string" && t !== "",
  //   );
  //   if (adjTexts.length === 1) params.adj = adjTexts[0];
  //   else if (adjTexts.length > 1) params.adj = adjTexts;
  //   if (adjTexts.length > 0) params.adjPos = "AFTER";

  //   nlg.spy.setPugHtml("");
  //   nlg.valueManager.value(word.text, params as never);
  //   return nlg.getFiltered();
  // };
}

function createVerbHelper(locale: string): Handlebars.HelperDelegate {
  // const nlg = getNlgLib(locale);
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

function createPostProcess(locale: string): (text: string) => string {
  return text => text;
  // const nlg = getNlgLib(locale);
  // return (text: string) => {
  //   nlg.spy.setPugHtml(text);
  //   return nlg.getFiltered();
  //   // return "postProcess " + text;
  // };
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
