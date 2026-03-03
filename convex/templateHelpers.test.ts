// @vitest-environment node

import { describe, expect, it } from "vitest";

import { generateQuestion } from "./questionGeneration";
import { getTemplateHelpersForLanguage } from "./templateHelpers";

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
      questionTemplate: '{{noun word=noun art="def"}}',
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
        'Le chat ___. Réponse: {{verb word=verb subject=noun tense="PRESENT"}}',
      answerTemplate: '{{verb word=verb subject=noun tense="PRESENT"}}',
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
