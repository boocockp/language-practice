import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { isSupportedLanguage, type LanguageCode } from "../lib/languages";

const STORAGE_KEY = "language-practice:current-language";
const DEFAULT_LANGUAGE: LanguageCode = "en";

function readStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored && isSupportedLanguage(stored)) return stored;
  return DEFAULT_LANGUAGE;
}

type CurrentLanguageContextValue = {
  language: LanguageCode;
  setLanguage: (code: string) => void;
};

const CurrentLanguageContext = createContext<CurrentLanguageContextValue | null>(
  null,
);

export function CurrentLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(readStoredLanguage);

  const setLanguage = useCallback((code: string) => {
    const valid = isSupportedLanguage(code) ? code : DEFAULT_LANGUAGE;
    setLanguageState(valid);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, valid);
    }
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language, setLanguage],
  );

  return (
    <CurrentLanguageContext.Provider value={value}>
      {children}
    </CurrentLanguageContext.Provider>
  );
}

// Context + hook pattern: Fast Refresh expects only components, but hooks are commonly co-located
// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentLanguage(): CurrentLanguageContextValue {
  const ctx = useContext(CurrentLanguageContext);
  if (!ctx) {
    throw new Error(
      "useCurrentLanguage must be used within a CurrentLanguageProvider",
    );
  }
  return ctx;
}
