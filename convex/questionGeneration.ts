/**
 * Question generation from Handlebars templates.
 * Data step: dataTemplate + storeData + word helper → data dict
 * Question/answer step: questionTemplate, answerTemplate + data → { text, expected }
 */

import Handlebars from "handlebars";

export type LookupWordFn = (
  text: string,
) => Promise<{ text: string; meaning: string } | null>;

export interface GenerateQuestionParams {
  dataTemplate: string;
  questionTemplate: string;
  answerTemplate: string;
  initialContext: Record<string, unknown>;
  lookupWord: LookupWordFn;
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
 * Flush microtasks so async storeData helpers complete before we use the data.
 * setTimeout(0) schedules a macrotask that runs after all pending microtasks.
 */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
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
  handlebars.registerHelper("word", function (this: unknown, options: Handlebars.HelperOptions) {
    const text = options.hash?.text;
    if (typeof text !== "string") return null;
    return lookupWord(text);
  });
  const transformed = transformDataTemplate(dataTemplate);
  const template = handlebars.compile(transformed);
  template(initialContext, { helpers: { storeData } } as Handlebars.RuntimeOptions);
  // await flushMicrotasks();
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
 * No word helper here (async); templates use stored data only.
 */
function runQuestionAnswerStep(
  questionTemplate: string,
  answerTemplate: string,
  data: Record<string, unknown>,
): { text: string; expected: string } {
  const handlebars = Handlebars.create();
  const qTemplate = handlebars.compile(questionTemplate);
  const aTemplate = handlebars.compile(answerTemplate);
  return {
    text: qTemplate(data),
    expected: aTemplate(data),
  };
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

  console.log("data", data);
  try {
    return runQuestionAnswerStep(questionTemplate, answerTemplate, data);
  } catch (err) {
    throw new Error(
      `Question/answer template error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
