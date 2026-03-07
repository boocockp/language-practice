/**
 * Supported languages for the app.
 * Names are in the language itself (e.g. "Français" for French).
 */
export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const LANGUAGES = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "English", flag: "🇬🇧" },
] as const;

const LANGUAGE_MAP = new Map<string, string>(LANGUAGES.map((l) => [l.code, l.name]));

const FLAG_MAP = new Map<string, string>(LANGUAGES.map((l) => [l.code, l.flag]));

/**
 * Returns the display name of a language given its ISO 639 code.
 * If the code is unknown, returns the code itself.
 */
export function getLanguageName(code: string): string {
    return LANGUAGE_MAP.get(code) ?? code;
}

/**
 * Returns the flag emoji for a language given its ISO 639 code.
 * If the code is unknown, returns empty string.
 */
export function getLanguageFlag(code: string): string {
    return FLAG_MAP.get(code) ?? "";
}

/**
 * Returns true if the given code is a supported language.
 */
export function isSupportedLanguage(code: string): code is (typeof LANGUAGES)[number]["code"] {
    return LANGUAGE_MAP.has(code);
}

/**
 * Returns a 2-letter language code suitable for the translate API.
 * Uses navigator.language when available (browser); falls back to "en" for SSR or unknown.
 * Normalizes locale forms like "en-US" to "en". Any 2-letter code is passed through for the API.
 */
export function getBrowserLanguageCode(): string {
    if (typeof navigator === "undefined" || !navigator.language) return "en";
    const code = navigator.language.slice(0, 2).toLowerCase();
    return code || "en";
}
