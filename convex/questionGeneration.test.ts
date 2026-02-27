// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import {
  generateQuestion,
  type GenerateQuestionParams,
  type LookupWordFn,
} from "./questionGeneration";

function defaultParams(
  overrides: Partial<GenerateQuestionParams> = {},
): GenerateQuestionParams {
  return {
    dataTemplate: "",
    questionTemplate: "",
    answerTemplate: "",
    initialContext: {},
    lookupWord: async () => null,
    ...overrides,
  };
}

describe("questionGeneration.generateQuestion", () => {
  it("empty dataTemplate passes {} to question/answer step", async () => {
    const result = await generateQuestion(
      defaultParams({
        dataTemplate: "",
        questionTemplate: "Q",
        answerTemplate: "A",
      }),
    );
    expect(result).toEqual({ text: "Q", expected: "A" });
  });

  it("dataTemplate with literal from context (lookup helper)", async () => {
    const result = await generateQuestion(
      defaultParams({
        dataTemplate: 'x = lookup this "val"',
        questionTemplate: "{{x}}",
        answerTemplate: "{{x}}",
        initialContext: { val: "hello" },
      }),
    );
    expect(result).toEqual({ text: "hello", expected: "hello" });
  });

  it("word helper: stores word data for question/answer templates", async () => {
    const lookupWord: LookupWordFn = async (text) =>
      text === "chat" ? { text: "chat", meaning: "cat" } : null;

    const result = await generateQuestion(
      defaultParams({
        dataTemplate: "word = word text=wordText",
        questionTemplate: "What is the meaning of {{#with word}}{{text}}{{/with}}?",
        answerTemplate: "{{#with word}}{{meaning}}{{/with}}",
        initialContext: { wordText: "chat" },
        lookupWord,
      }),
    );
    expect(result).toEqual({
      text: "What is the meaning of chat?",
      expected: "cat",
    });
  });

  it("word helper returns null - template outputs nothing for missing data", async () => {
    const lookupWord: LookupWordFn = async () => null;

    const result = await generateQuestion(
      defaultParams({
        dataTemplate: "word = word text=wordText",
        questionTemplate: "{{#with word}}{{text}}{{/with}}",
        answerTemplate: "{{#with word}}{{meaning}}{{/with}}",
        initialContext: { wordText: "missing" },
        lookupWord,
      }),
    );
    // #with null/undefined produces empty output
    expect(result).toEqual({ text: "", expected: "" });
  });

  it("dataTemplate: multiple lines and blank lines", async () => {
    const result = await generateQuestion(
      defaultParams({
        dataTemplate: 'a = lookup this "valA"\n\nb = lookup this "valB"',
        questionTemplate: "{{a}}-{{b}}",
        answerTemplate: "{{b}}",
        initialContext: { valA: "A", valB: "B" },
      }),
    );
    expect(result).toEqual({ text: "A-B", expected: "B" });
  });

  it("dataTemplate: malformed line without = is left as-is (no storeData)", async () => {
    const result = await generateQuestion(
      defaultParams({
        dataTemplate: 'x = lookup this "valX"\nmalformed line',
        questionTemplate: "{{x}}",
        answerTemplate: "{{x}}",
        initialContext: { valX: "X" },
      }),
    );
    // Only x is stored from the first line
    expect(result).toEqual({ text: "X", expected: "X" });
  });

  it("template compile error in questionTemplate throws clear message", async () => {
    await expect(
      generateQuestion(
        defaultParams({
          questionTemplate: "{{#unclosed",
          answerTemplate: "A",
        }),
      ),
    ).rejects.toThrow(/Question\/answer template error/);
  });

  it("template compile error in answerTemplate throws clear message", async () => {
    await expect(
      generateQuestion(
        defaultParams({
          questionTemplate: "Q",
          answerTemplate: "{{#bad",
        }),
      ),
    ).rejects.toThrow(/Question\/answer template error/);
  });

  it("template runtime: missing variable outputs empty", async () => {
    const result = await generateQuestion(
      defaultParams({
        questionTemplate: "{{missing}}",
        answerTemplate: "{{alsoMissing}}",
      }),
    );
    expect(result).toEqual({ text: "", expected: "" });
  });

  it("dataTemplate error propagates with clear message", async () => {
    const lookupWord: LookupWordFn = async () => {
      throw new Error("DB connection failed");
    };

    await expect(
      generateQuestion(
        defaultParams({
          dataTemplate: "word = word text=wordText",
          questionTemplate: "Q",
          answerTemplate: "A",
          initialContext: { wordText: "x" },
          lookupWord,
        }),
      ),
    ).rejects.toThrow(/Data template error/);
  });
});
