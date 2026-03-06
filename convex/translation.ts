"use node";

/**
 * Self-contained translation layer for the Auto Translation feature.
 * Translates text via LibreTranslate (or compatible API) using the translate npm package.
 * Used by the Handlebars translate helper; no Handlebars dependency here.
 */

import { Translate } from "translate";

export type TranslateFn = (
  text: string,
  from: string,
  to: string,
) => Promise<string>;

const DEFAULT_URL = "https://libretranslate.com";

/**
 * Creates a translator function that calls the LibreTranslate API.
 * When config is omitted, uses process.env.LIBRETRANSLATE_URL and
 * process.env.LIBRETRANSLATE_API_KEY so production can rely on env;
 * tests can inject a mock config.
 */
export function createTranslator(config?: {
  url?: string;
  apiKey?: string;
}): TranslateFn {
  const url = config?.url ?? process.env.LIBRETRANSLATE_URL ?? DEFAULT_URL;
  const key = config?.apiKey ?? process.env.LIBRETRANSLATE_API_KEY;

  const instance = (Translate as (opts: {
    engine: "libre";
    url?: string;
    key?: string;
  }) => (text: string, opts: { from: string; to: string }) => Promise<string>)(
    { engine: "libre", url, key },
  );

  return async function translateText(
    text: string,
    fromLang: string,
    toLang: string,
  ): Promise<string> {
    const trimmed = text.trim();
    if (trimmed === "" || fromLang === toLang) {
      return text;
    }
    return instance(trimmed, { from: fromLang, to: toLang });
  };
}
