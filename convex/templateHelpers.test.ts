// @vitest-environment node

import { describe, expect, it } from "vitest";

import { generateQuestion } from "./questionGeneration";
import {
  createTranslateHelper,
  getTemplateHelpersForLanguage,
} from "./templateHelpers";

describe("translate helper", () => {
  it("renders stubbed translation when fromLang !== toLang", async () => {
    const translateFn = async (
      text: string,
      from: string,
      to: string,
    ): Promise<string> => {
      expect(from).toBe("fr");
      expect(to).toBe("en");
      return text === "bonjour" ? "hello" : text === "merci" ? "thanks" : text;
    };
    const translateHelper = createTranslateHelper("fr", "en", translateFn);
    const templateHelpers = { translate: translateHelper };

    const result = await generateQuestion({
      dataTemplate: "",
      questionTemplate: '{{translate "bonjour"}}',
      answerTemplate: '{{translate "merci"}}',
      initialContext: {},
      lookupWord: async () => null,
      language: "fr",
      templateHelpers,
    });

    expect(result.text).toBe("hello");
    expect(result.expected).toBe("thanks");
  });

  it("returns text unchanged when fromLang === toLang", async () => {
    const translateFn = async (): Promise<string> => {
      throw new Error("should not be called");
    };
    const translateHelper = createTranslateHelper("en", "en", translateFn);
    const templateHelpers = { translate: translateHelper };

    const result = await generateQuestion({
      dataTemplate: "",
      questionTemplate: '{{translate "hello"}}',
      answerTemplate: '{{translate "world"}}',
      initialContext: {},
      lookupWord: async () => null,
      language: "en",
      templateHelpers,
    });

    expect(result.text).toBe("hello");
    expect(result.expected).toBe("world");
  });

  it("returns empty string when translate receives empty string", async () => {
    const translateFn = async (): Promise<string> => {
      throw new Error("should not be called");
    };
    const translateHelper = createTranslateHelper("fr", "en", translateFn);
    const templateHelpers = { translate: translateHelper };

    const result = await generateQuestion({
      dataTemplate: "",
      questionTemplate: '{{translate ""}}',
      answerTemplate: "x",
      initialContext: {},
      lookupWord: async () => null,
      language: "fr",
      templateHelpers,
    });

    expect(result.text).toBe("");
    expect(result.expected).toBe("x");
  });
});

describe("getTemplateHelpersForLanguage", () => {
  it("returns undefined for non-French languages", () => {
    const { templateHelpers, postProcess } =
      getTemplateHelpersForLanguage("en");
    expect(templateHelpers).toBeUndefined();
    expect(postProcess).toBeUndefined();
  });

  it("noun helper: definite article for chat produces le chat", async () => {
    const { templateHelpers, postProcess } =
      getTemplateHelpersForLanguage("fr");
    expect(templateHelpers).toBeDefined();
    expect(postProcess).toBeDefined();

    const lookupWord = async (opts: { text?: string }) =>
      opts.text === "chat"
        ? { _id: "w1", text: "chat", type: "nm", meaning: "cat" }
        : null;

    const result = await generateQuestion({
      dataTemplate: 'noun = word text="chat"',
      questionTemplate: '{{noun noun art="def"}}',
      answerTemplate: "le chat",
      initialContext: {},
      lookupWord,
      language: "fr",
      templateHelpers,
      postProcess,
    });

    expect(result.text.toLowerCase()).toBe("le chat");
    expect(result.expected.toLowerCase()).toBe("le chat");
  });

  it("noun helper: indefinite article for chat produces un chat", async () => {
    const { templateHelpers, postProcess } =
      getTemplateHelpersForLanguage("fr");
    expect(templateHelpers).toBeDefined();

    const lookupWord = async (opts: { text?: string }) =>
      opts.text === "chat"
        ? { _id: "w1", text: "chat", type: "nm", meaning: "cat" }
        : null;

    const result = await generateQuestion({
      dataTemplate: 'noun = word text="chat"',
      questionTemplate: '{{noun noun art="ind"}}',
      answerTemplate: "un chat",
      initialContext: {},
      lookupWord,
      language: "fr",
      templateHelpers,
      postProcess,
    });

    expect(result.text.toLowerCase()).toBe("un chat");
    expect(result.expected.toLowerCase()).toBe("un chat");
  });

  it("noun helper: definite plural for chat produces les chats", async () => {
    const { templateHelpers, postProcess } =
      getTemplateHelpersForLanguage("fr");
    expect(templateHelpers).toBeDefined();

    const lookupWord = async (opts: { text?: string }) =>
      opts.text === "chat"
        ? { _id: "w1", text: "chat", type: "nm", meaning: "cat" }
        : null;

    const result = await generateQuestion({
      dataTemplate: 'noun = word text="chat"',
      questionTemplate: '{{noun noun art="def" num="P"}}',
      answerTemplate: "les chats",
      initialContext: {},
      lookupWord,
      language: "fr",
      templateHelpers,
      postProcess,
    });

    expect(result.text.toLowerCase()).toBe("les chats");
    expect(result.expected.toLowerCase()).toBe("les chats");
  });

  it("noun helper: indefinite plural produces des + plural noun", async () => {
    const { templateHelpers, postProcess } =
      getTemplateHelpersForLanguage("fr");
    expect(templateHelpers).toBeDefined();

    const lookupWord = async (opts: { text?: string }) =>
      opts.text === "chat"
        ? { _id: "w1", text: "chat", type: "nm", meaning: "cat" }
        : null;

    const result = await generateQuestion({
      dataTemplate: 'noun = word text="chat"',
      questionTemplate: '{{noun noun art="ind" num="P"}}',
      answerTemplate: "des chats",
      initialContext: {},
      lookupWord,
      language: "fr",
      templateHelpers,
      postProcess,
    });

    expect(result.text.toLowerCase()).toBe("des chats");
    expect(result.expected.toLowerCase()).toBe("des chats");
  });

  it("noun helper: adjective agrees with masculine noun", async () => {
    const { templateHelpers, postProcess } =
      getTemplateHelpersForLanguage("fr");
    expect(templateHelpers).toBeDefined();

    const lookupWord = async (opts: { text?: string }) =>
      opts.text === "chat"
        ? { _id: "w1", text: "chat", type: "nm", meaning: "cat" }
        : opts.text === "grand"
          ? { _id: "w2", text: "grand", type: "adj", meaning: "big" }
          : null;

    const result = await generateQuestion({
      dataTemplate:
        'noun = word text="chat"\nadj = word text="grand"',
      questionTemplate: '{{noun noun adj=adj art="def"}}',
      answerTemplate: "le chat grand",
      initialContext: {},
      lookupWord,
      language: "fr",
      templateHelpers,
      postProcess,
    });

    expect(result.text.toLowerCase()).toBe("le chat grand");
    expect(result.expected.toLowerCase()).toBe("le chat grand");
  });

  it("noun helper: adjective agrees with feminine noun", async () => {
    const { templateHelpers, postProcess } =
      getTemplateHelpersForLanguage("fr");
    expect(templateHelpers).toBeDefined();

    const lookupWord = async (opts: { text?: string }) =>
      opts.text === "maison"
        ? { _id: "w1", text: "maison", type: "nf", meaning: "house" }
        : opts.text === "grand"
          ? { _id: "w2", text: "grand", type: "adj", meaning: "big" }
          : null;

    const result = await generateQuestion({
      dataTemplate:
        'noun = word text="maison"\nadj = word text="grand"',
      questionTemplate: '{{noun noun adj=adj art="def"}}',
      answerTemplate: "la maison grande",
      initialContext: {},
      lookupWord,
      language: "fr",
      templateHelpers,
      postProcess,
    });

    expect(result.text.toLowerCase()).toBe("la maison grande");
    expect(result.expected.toLowerCase()).toBe("la maison grande");
  });

  it("verb helper: manger conjugated for chat subject produces mange", async () => {
    const { templateHelpers, postProcess } =
      getTemplateHelpersForLanguage("fr");
    expect(templateHelpers).toBeDefined();
    expect(postProcess).toBeDefined();

    const lookupWord = async (opts: { text?: string }) =>
      opts.text === "chat"
        ? { _id: "w1", text: "chat", type: "nm", meaning: "cat" }
        : opts.text === "manger"
          ? { _id: "w2", text: "manger", type: "vtr", meaning: "to eat" }
          : null;

    const result = await generateQuestion({
      dataTemplate: 'noun = word text="chat"\nverb = word text="manger"',
      questionTemplate:
        'Le chat ___. Réponse: {{verb verb subject=noun tense="PRESENT"}}',
      answerTemplate: '{{verb verb subject=noun tense="PRESENT"}}',
      initialContext: {},
      lookupWord,
      language: "fr",
      templateHelpers,
      postProcess,
    });

    expect(result).not.toBeNull();
    expect(result.text).toContain("mange");
    expect(result.expected.toLowerCase()).toBe("mange");
  });
});
