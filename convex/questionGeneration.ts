"use node";

/**
 * Question generation from Handlebars templates.
 * Data step: dataTemplate + storeData + word helper → data dict (line-by-line, accumulating context)
 * Question/answer step: questionTemplate, answerTemplate + data → { text, expected }
 * Uses handlebars-async-helpers so all template execution is async and one Handlebars instance is shared.
 */

import Handlebars from "handlebars";

/** Wrapped Handlebars instance from handlebars-async-helpers; compile returns a Promise-returning template. */
type AsyncHandlebars = Omit<typeof Handlebars, "compile"> & {
    compile: (template: string) => (context: unknown) => Promise<string>;
};

async function getAsyncHandlebars(): Promise<(hbs: typeof Handlebars) => AsyncHandlebars> {
    const mod = await import("handlebars-async-helpers");
    return (mod.default ?? mod) as (hbs: typeof Handlebars) => AsyncHandlebars;
}

export type WordLookupOptions = {
    text?: string;
    type?: string;
    tags?: string;
};

export type LookupWordFn = (options: WordLookupOptions) => Promise<{
    _id: string;
    text: string;
    type: string;
    meaning: string;
} | null>;

/**
 * Create the Handlebars word helper that passes hash options to lookupWord.
 * Used in the data step for question generation. Returns a Promise; callers must await.
 */
export function createWordHelper(lookupWord: LookupWordFn) {
    return function (this: unknown, options: Handlebars.HelperOptions) {
        const hash = options.hash ?? {};
        const text = typeof hash.text === "string" && hash.text !== "" ? hash.text : undefined;
        const type = typeof hash.type === "string" && hash.type !== "" ? hash.type : undefined;
        const tags = typeof hash.tags === "string" && hash.tags !== "" ? hash.tags : undefined;
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

/** Parsed line: name = data-expression (only for lines that match that pattern) */
function parseDataTemplateLines(dataTemplate: string): Array<{ name: string; expr: string }> {
    const lines: Array<{ name: string; expr: string }> = [];
    for (const line of dataTemplate.split("\n")) {
        const trimmed = line.trim();
        if (trimmed === "") continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const name = trimmed.slice(0, eqIndex).trim();
        const expr = trimmed.slice(eqIndex + 1).trim();
        if (!name || !expr) continue;
        lines.push({ name, expr });
    }
    return lines;
}

/**
 * Run the data step: execute dataTemplate line-by-line with accumulating context.
 * Each line either evaluates expr as a template (if expr contains "{{") or uses storeData(expr).
 * The same context is passed to each line so earlier values can be used in later lines.
 */
async function runDataStep(
    hb: AsyncHandlebars,
    dataTemplate: string,
    initialContext: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = { ...initialContext };
    const lines = parseDataTemplateLines(dataTemplate);

    for (const { name, expr } of lines) {
        if (expr.includes("{{")) {
            const template = hb.compile(expr);
            const result = await template(context);
            context[name] = result;
        } else {
            const storeDataLine = `{{{storeData "${name}" (${expr})}}}`;
            const template = hb.compile(storeDataLine);
            await template(context);
        }
    }
    return context;
}

/**
 * Run the question/answer step: compile and run templates with the shared Handlebars instance.
 * Applies postProcess to output when provided.
 */
async function runQuestionAnswerStep(
    hb: AsyncHandlebars,
    questionTemplate: string,
    answerTemplate: string,
    data: Record<string, unknown>,
    postProcess?: (text: string) => string,
): Promise<{ text: string; expected: string }> {
    const qTemplate = hb.compile(questionTemplate);
    const aTemplate = hb.compile(answerTemplate);
    let text = await qTemplate(data);
    let expected = await aTemplate(data);
    if (postProcess) {
        text = postProcess(text);
        expected = postProcess(expected);
    }
    return { text, expected };
}

/**
 * Generate question text and expected answer from a question type.
 * Uses a single async Handlebars instance for data and question/answer steps.
 * @throws Error on template compile or runtime errors
 */
export async function generateQuestion(params: GenerateQuestionParams): Promise<GenerateQuestionResult> {
    const { dataTemplate, questionTemplate, answerTemplate, initialContext, lookupWord, templateHelpers, postProcess } =
        params;

    const hb = (await getAsyncHandlebars())(Handlebars);

    const storeData = async function (this: Record<string, unknown>, key: string, value: unknown) {
        const resolved = await Promise.resolve(value);
        this[key] = resolved;
    };
    hb.registerHelper("storeData", storeData);
    hb.registerHelper("word", createWordHelper(lookupWord));
    if (templateHelpers) {
        for (const [name, fn] of Object.entries(templateHelpers)) {
            hb.registerHelper(name, fn);
        }
    }

    let data: Record<string, unknown>;
    const dataTemplateTrimmed = dataTemplate.trim();
    if (dataTemplateTrimmed === "") {
        data = {};
    } else {
        try {
            data = await runDataStep(hb, dataTemplate, initialContext);
        } catch (err) {
            throw new Error(`Data template error: ${err instanceof Error ? err.message : String(err)}`, {
                cause: err,
            });
        }
    }

    try {
        return await runQuestionAnswerStep(hb, questionTemplate, answerTemplate, data, postProcess);
    } catch (err) {
        throw new Error(`Question/answer template error: ${err instanceof Error ? err.message : String(err)}`, {
            cause: err,
        });
    }
}
