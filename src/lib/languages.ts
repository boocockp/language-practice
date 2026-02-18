/**
 * Supported languages for the app.
 * Names are in the language itself (e.g. "Français" for French).
 */
export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const LANGUAGES = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
] as const;

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

const LANGUAGE_MAP = new Map<string, string>(
  LANGUAGES.map((l) => [l.code, l.name]),
);

/**
 * Returns the display name of a language given its ISO 639 code.
 * If the code is unknown, returns the code itself.
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_MAP.get(code) ?? code;
}

/**
 * Returns true if the given code is a supported language.
 */
export function isSupportedLanguage(code: string): code is (typeof LANGUAGES)[number]["code"] {
  return LANGUAGE_MAP.has(code);
}
