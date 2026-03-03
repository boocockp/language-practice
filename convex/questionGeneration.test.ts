// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import Handlebars from "handlebars";
import { describe, expect, it } from "vitest";

import {
  createWordHelper,
  generateQuestion,
  type GenerateQuestionParams,
  type LookupWordFn,
  type WordLookupOptions,
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
    const lookupWord: LookupWordFn = async (opts) =>
      opts.text === "chat"
        ? { _id: "w1", text: "chat", type: "nm", meaning: "cat" }
        : null;

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

  it("word helper with type only passes type to lookup", async () => {
    const lookupWord: LookupWordFn = async (opts) =>
      opts.type === "nm,nf"
        ? { _id: "w1", text: "chat", type: "nm", meaning: "cat" }
        : null;

    const result = await generateQuestion(
      defaultParams({
        dataTemplate: 'word = word type="nm,nf"',
        questionTemplate: "{{word.text}}",
        answerTemplate: "{{word.meaning}}",
        lookupWord,
      }),
    );
    expect(result).toEqual({ text: "chat", expected: "cat" });
  });

  it("word helper with tags only passes tags to lookup", async () => {
    const lookupWord: LookupWordFn = async (opts) =>
      opts.tags === "abc&ghi,jkl"
        ? { _id: "w1", text: "xyz", type: "nm", meaning: "something" }
        : null;

    const result = await generateQuestion(
      defaultParams({
        dataTemplate: 'word = word tags="abc&ghi,jkl"',
        questionTemplate: "{{word.text}}",
        answerTemplate: "{{word.meaning}}",
        lookupWord,
      }),
    );
    expect(result).toEqual({ text: "xyz", expected: "something" });
  });

  it("word helper with multiple options passes all to lookup", async () => {
    const lookupWord: LookupWordFn = async (opts) =>
      opts.text === "chat" && opts.type === "nm"
        ? { _id: "w1", text: "chat", type: "nm", meaning: "cat" }
        : null;

    const result = await generateQuestion(
      defaultParams({
        dataTemplate: 'word = word text="chat" type="nm"',
        questionTemplate: "{{word.text}}",
        answerTemplate: "{{word.meaning}}",
        lookupWord,
      }),
    );
    expect(result).toEqual({ text: "chat", expected: "cat" });
  });

  it("word helper with no options passes empty object to lookup", async () => {
    const lookupWord: LookupWordFn = async (opts) => {
      expect(opts).toEqual({});
      return { _id: "w1", text: "random", type: "nm", meaning: "any" };
    };

    const result = await generateQuestion(
      defaultParams({
        dataTemplate: "word = word",
        questionTemplate: "{{word.text}}",
        answerTemplate: "{{word.meaning}}",
        lookupWord,
      }),
    );
    expect(result).toEqual({ text: "random", expected: "any" });
  });

  it("templateHelpers are registered and used in question/answer templates", async () => {
    const nounCalls: unknown[] = [];
    const verbCalls: unknown[] = [];

    const templateHelpers: Record<string, Handlebars.HelperDelegate> = {
      noun: (options: Handlebars.HelperOptions) => {
        nounCalls.push(options.hash);
        const word = options.hash?.word as { text?: string } | undefined;
        return word?.text ? `[noun:${word.text}]` : "";
      },
      verb: (options: Handlebars.HelperOptions) => {
        verbCalls.push(options.hash);
        const word = options.hash?.word as { text?: string } | undefined;
        return word?.text ? `[verb:${word.text}]` : "";
      },
    };

    const foo = { text: "chat", type: "nm", meaning: "cat" };
    const bar = { text: "manger", type: "vtr", meaning: "eat" };

    const result = await generateQuestion(
      defaultParams({
        dataTemplate: 'foo = lookup this "foo"\nbar = lookup this "bar"',
        questionTemplate: "{{noun word=foo}}",
        answerTemplate: '{{verb word=bar subject=foo tense="PRESENT"}}',
        initialContext: { foo, bar },
        templateHelpers,
      }),
    );

    expect(nounCalls).toHaveLength(1);
    expect((nounCalls[0] as Record<string, unknown>).word).toEqual(foo);
    expect(verbCalls).toHaveLength(1);
    expect((verbCalls[0] as Record<string, unknown>).word).toEqual(bar);
    expect((verbCalls[0] as Record<string, unknown>).subject).toEqual(foo);
    expect((verbCalls[0] as Record<string, unknown>).tense).toBe("PRESENT");
    expect(result).toEqual({
      text: "[noun:chat]",
      expected: "[verb:manger]",
    });
  });

  it("postProcess is applied to question and answer output", async () => {
    const result = await generateQuestion(
      defaultParams({
        dataTemplate: "",
        questionTemplate: "raw question",
        answerTemplate: "raw answer",
        postProcess: (t) => `[processed:${t}]`,
      }),
    );
    expect(result).toEqual({
      text: "[processed:raw question]",
      expected: "[processed:raw answer]",
    });
  });
});

describe("createWordHelper", () => {
  it("passes hash options to lookupWord and returns result", async () => {
    const received: WordLookupOptions[] = [];
    const lookupWord: LookupWordFn = async (opts) => {
      received.push(opts);
      return { _id: "w1", text: "got", type: "nm", meaning: "it" };
    };
    const helper = createWordHelper(lookupWord);

    const mockOptions = {
      hash: { text: "chat", type: "nm", tags: "a&b,c" },
      fn: () => "",
      inverse: () => "",
      data: {},
      loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
    } as Handlebars.HelperOptions;

    const result = await helper.call(null, mockOptions);
    expect(received).toEqual([{ text: "chat", type: "nm", tags: "a&b,c" }]);
    expect(result).toEqual({ _id: "w1", text: "got", type: "nm", meaning: "it" });
  });

  it("treats empty string options as undefined", async () => {
    const received: WordLookupOptions[] = [];
    const lookupWord: LookupWordFn = async (opts) => {
      received.push(opts);
      return null;
    };
    const helper = createWordHelper(lookupWord);

    const mockOptions = {
      hash: { text: "", type: "", tags: "" },
      fn: () => "",
      inverse: () => "",
      data: {},
      loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
    } as Handlebars.HelperOptions;

    await helper.call(null, mockOptions);
    expect(received).toEqual([{}]);
  });
});
