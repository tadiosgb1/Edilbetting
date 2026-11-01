"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import en from "@/languages/en.json";
import am from "@/languages/am.json";
import ti from "@/languages/ti.json";

export type AppLanguage = "en" | "am" | "ti";

const translations: Record<AppLanguage, Record<string, string>> = {
  en,
  am,
  ti,
};

const LanguageContext = createContext<{
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (text: string) => string;
}>({
  language: "en",
  setLanguage: () => {},
  t: (text) => text,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("edilbet-language");

    if (saved === "en" || saved === "am" || saved === "ti") {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    window.localStorage.setItem("edilbet-language", language);
  }, [language]);

  const toTranslationKey = (text: string) => {
    // Accept camelCase keys and normalize legacy English phrases.
    if (/^[a-z][A-Za-z0-9]*$/.test(text)) return text;
    const words = text.normalize("NFKD").match(/[A-Za-z0-9]+/g) || [];
    return words.map((word, index) =>
      index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()
    ).join("");
  };

  const t = (text: string) => {
    const key = toTranslationKey(text);
    // Missing Amharic or Tigrigna translations safely use the English value.
    return translations[language][key] ?? translations.en[key] ?? text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="edilbet-language">
        {t("language")}
      </label>

      <select
        id={compact ? "edilbet-language-compact" : "edilbet-language"}
        aria-label={t("language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as AppLanguage)}
        className="max-w-full rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs font-semibold text-white shadow-sm outline-none focus:border-amber-400"
      >
        <option value="en">English</option>
        <option value="am">አማርኛ</option>
        <option value="ti">ትግርኛ</option>
      </select>
    </div>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
