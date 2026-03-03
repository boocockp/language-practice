"use node";

import type Handlebars from "handlebars";
console.log("In templateHelpers before import");
import { NlgLib } from "rosaenlg-lib";
console.log("In templateHelpers after import");


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

const nlgCache = new Map<string, NlgLib>();

function getNlgLib(locale: string): NlgLib {
  let nlg = nlgCache.get(locale);
  if (!nlg) {
    console.log("In templateHelpers creating ", locale);
    nlg = new NlgLib({ language: locale, renderDebug: false });
    console.log("In templateHelpers created ", locale);
    nlgCache.set(locale, nlg);
  }
  return nlg;
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

type WordObj = { text: string; type?: string; meaning?: string } | null;

function createNounHelper(locale: string): Handlebars.HelperDelegate {
  console.log("In createNounHelper before getNlgLib", locale);
  const nlg = getNlgLib(locale);
  // return function (this: unknown, options: Handlebars.HelperOptions) {
  //   console.log("In createNounHelper before getNlgLib", locale);
  //   return "noun helper " + ((options?.hash as { word?: WordObj })?.word as WordObj)?.text;
  // }
  return function (this: unknown, options: Handlebars.HelperOptions) {
    const hash = options.hash ?? {};
    const word = hash.word as WordObj;
    if (!word || typeof word.text !== "string") return "";

    const adj = hash.adj as WordObj | undefined;
    const adj2 = hash.adj2 as WordObj | undefined;
    const art = hash.art as string | undefined;
    const num = hash.num as string | undefined;

    console.log("In createNounHelper", word.text, num, art, adj?.text, adj2?.text);

    const params: Record<string, unknown> = {
      number: num === "P" ? "P" : "S",
      gender: wordTypeToGender(word.type),
    };

    if (art === "def") params.det = "DEFINITE";
    else if (art === "ind") params.det = "INDEFINITE";

    const adjTexts = [adj?.text, adj2?.text].filter(
      (t): t is string => typeof t === "string" && t !== "",
    );
    if (adjTexts.length === 1) params.adj = adjTexts[0];
    else if (adjTexts.length > 1) params.adj = adjTexts;
    if (adjTexts.length > 0) params.adjPos = "AFTER";

    nlg.spy.setPugHtml("");
    console.log("In createNounHelper before valueManager", word.text, params);
    nlg.valueManager.value(word.text, params as never);
    return nlg.getFiltered();
  };
}

function createVerbHelper(locale: string): Handlebars.HelperDelegate {
  const nlg = getNlgLib(locale);
  // return function (this: unknown, options: Handlebars.HelperOptions) {
  //   console.log("In createVerbHelper before getNlgLib", locale);
  //   return "verb helper " + ((options?.hash as { word?: WordObj })?.word as WordObj)?.text;
  // } 
  return function (this: unknown, options: Handlebars.HelperOptions) {
    const hash = options.hash ?? {};
    const word = hash.word as WordObj;
    const subject = hash.subject as WordObj;
    const tense = hash.tense as string | undefined;
    const num = hash.num as string | undefined;

    console.log("In createVerbHelper", word?.text, subject?.text, tense, num);

    if (!word || typeof word.text !== "string") return "";
    if (!subject || typeof subject.text !== "string") return "";
    if (!tense || typeof tense !== "string") return "";

    const number = num === "P" ? "P" : "S";
    const person = number === "P" ? "3P" : "3S";
    const subjectAnon = nlg.genderNumberManager.getAnonymous(
      wordTypeToGender(subject.type),
      number,
    );

    console.log("In createVerbHelper before getAgreeVerb", subjectAnon, person, word.text, tense);
    const result = nlg.verbsManager.getAgreeVerb(
      subjectAnon,
      person as "3S" | "3P",
      { verb: word.text, tense: tense as "present" | "past" | "future" },
      {},
    );
    console.log("In createVerbHelper after getAgreeVerb", result);
    return result;
  };
}

function createPostProcess(locale: string): (text: string) => string {
  const nlg = getNlgLib(locale);
  return (text: string) => {
    nlg.spy.setPugHtml(text);
    return nlg.getFiltered();
    // return "postProcess " + text;
  };
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
