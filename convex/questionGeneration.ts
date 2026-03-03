/**
 * Question generation from Handlebars templates.
 * Data step: dataTemplate + storeData + word helper → data dict
 * Question/answer step: questionTemplate, answerTemplate + data → { text, expected }
 */

import Handlebars from "handlebars";

export type WordLookupOptions = {
  text?: string;
  type?: string;
  tags?: string;
};

export type LookupWordFn = (
  options: WordLookupOptions,
) => Promise<{
  _id: string;
  text: string;
  type: string;
  meaning: string;
} | null>;

/**
 * Create the Handlebars word helper that passes hash options to lookupWord.
 * Used in the data step for question generation.
 */
export function createWordHelper(lookupWord: LookupWordFn) {
  return function (this: unknown, options: Handlebars.HelperOptions) {
    const hash = options.hash ?? {};
    const text =
      typeof hash.text === "string" && hash.text !== "" ? hash.text : undefined;
    const type =
      typeof hash.type === "string" && hash.type !== "" ? hash.type : undefined;
    const tags =
      typeof hash.tags === "string" && hash.tags !== "" ? hash.tags : undefined;
    return lookupWord({ text, type, tags });
  };
}

export interface GenerateQuestionParams {
  dataTemplate: string;
  questionTemplate: string;
  answerTemplate: string;
  initialContext: Record<string, unknown>;
  lookupWord: LookupWordFn;
  /** Language code for helper context (e.g. 'fr', 'en') */
  language?: string;
  /** Helpers to register for question/answer templates (e.g. noun, verb) */
  templateHelpers?: Record<string, Handlebars.HelperDelegate>;
  /** Applied to question and answer text after rendering (e.g. contractions) */
  postProcess?: (text: string) => string;
}

export interface GenerateQuestionResult {
  text: string;
  expected: string;
}

/**
 * Transform dataTemplate lines "<name> = <data-expression>" into
 * "{{{storeData '<name>' ( <data-expression>)}}}"
 */
function transformDataTemplate(dataTemplate: string): string {
  return dataTemplate
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === "") return "";
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) return line;
      const name = trimmed.slice(0, eqIndex).trim();
      const expr = trimmed.slice(eqIndex + 1).trim();
      if (!name || !expr) return line;
      return `{{{storeData "${name}" (${expr})}}}`;
    })
    .join("\n");
}

/**
 * Run the data step: execute dataTemplate with storeData and word helpers,
 * return the collected data dictionary.
 */
async function runDataStep(
  dataTemplate: string,
  initialContext: Record<string, unknown>,
  lookupWord: LookupWordFn,
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};
  const storeData = async (key: string, value: unknown) => {
    data[key] = value;
  };
  const handlebars = Handlebars.create();
  handlebars.registerHelper("storeData", storeData);
  handlebars.registerHelper("word", createWordHelper(lookupWord));
  const transformed = transformDataTemplate(dataTemplate);
  const template = handlebars.compile(transformed);
  template(initialContext, { helpers: { storeData } } as Handlebars.RuntimeOptions);
  await Promise.all(Object.entries(data).map(async ([key, value]) => {
    if (value instanceof Promise) {
      data[key] = await value;
      }
    }),
  );
  return data;
}

/**
 * Run the question/answer step: compile templates and render with data.
 * Registers templateHelpers when provided. Applies postProcess to output when provided.
 */
function runQuestionAnswerStep(
  questionTemplate: string,
  answerTemplate: string,
  data: Record<string, unknown>,
  options?: {
    templateHelpers?: Record<string, Handlebars.HelperDelegate>;
    postProcess?: (text: string) => string;
  },
): { text: string; expected: string } {
  const handlebars = Handlebars.create();
  if (options?.templateHelpers) {
    for (const [name, fn] of Object.entries(options.templateHelpers)) {
      handlebars.registerHelper(name, fn);
    }
  }
  const qTemplate = handlebars.compile(questionTemplate);
  const aTemplate = handlebars.compile(answerTemplate);
  let text = qTemplate(data);
  let expected = aTemplate(data);
  if (options?.postProcess) {
    text = options.postProcess(text);
    expected = options.postProcess(expected);
  }
  return { text, expected };
}

/**
 * Generate question text and expected answer from a question type.
 * @throws Error on template compile or runtime errors
 */
export async function generateQuestion(
  params: GenerateQuestionParams,
): Promise<GenerateQuestionResult> {
  const {
    dataTemplate,
    questionTemplate,
    answerTemplate,
    initialContext,
    lookupWord,
    templateHelpers,
    postProcess,
  } = params;

  let data: Record<string, unknown>;
  const dataTemplateTrimmed = dataTemplate.trim();
  if (dataTemplateTrimmed === "") {
    data = {};
  } else {
    try {
      data = await runDataStep(
        dataTemplate,
        initialContext,
        lookupWord,
      );
    } catch (err) {
      throw new Error(
        `Data template error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // console.log("data", data);
  try {
    return runQuestionAnswerStep(questionTemplate, answerTemplate, data, {
      templateHelpers,
      postProcess,
    });
  } catch (err) {
    throw new Error(
      `Question/answer template error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
