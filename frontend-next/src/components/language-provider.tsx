"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppLanguage = "en" | "am" | "ti";
const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    language: "Language", English: "English", Amharic: "አማርኛ", Tigrigna: "ትግርኛ",
    "Welcome back.": "Welcome back.", "Phone number": "Phone number", Password: "Password",
    "Sign in": "Sign in", "Create an account": "Create an account", "Search matches…": "Search matches…",
    Home: "Home", Sports: "Sports", Live: "Live", "Upcoming Matches": "Upcoming Matches",
    "No matches found": "No matches found", "Play responsibly": "Play responsibly",
    "Your slip is empty": "Your slip is empty", "Continue to sign in": "Continue to sign in",
  },
  am: {
    language: "ቋንቋ", English: "English", Amharic: "አማርኛ", Tigrigna: "ትግርኛ",
    "Welcome back.": "እንኳን ደህና መጡ።", "Phone number": "ስልክ ቁጥር", Password: "የይለፍ ቃል",
    "Sign in": "ግባ", "Create an account": "መለያ ፍጠር", "Search matches…": "ጨዋታዎችን ፈልግ…",
    Home: "መነሻ", Sports: "ስፖርቶች", Live: "በቀጥታ", "Upcoming Matches": "መጪ ጨዋታዎች",
    "No matches found": "ምንም ጨዋታ አልተገኘም", "Play responsibly": "በኃላፊነት ይጫወቱ",
    "Your slip is empty": "የውርርድ ዝርዝርዎ ባዶ ነው", "Continue to sign in": "ለመግባት ይቀጥሉ",
  },
  ti: {
    language: "ቋንቋ", English: "English", Amharic: "ኣማርኛ", Tigrigna: "ትግርኛ",
    "Welcome back.": "እንቋዕ ብደሓን መጻእኩም።", "Phone number": "ቁጽሪ ተሌፎን", Password: "መሕለፊ ቃል",
    "Sign in": "እቶ", "Create an account": "ሕሳብ ፍጠር", "Search matches…": "ጸወታታት ድለ…",
    Home: "መበገሲ", Sports: "ስፖርት", Live: "ብቐጥታ", "Upcoming Matches": "ዝመጽኡ ጸወታታት",
    "No matches found": "ዝተረኽበ ጸወታ የለን", "Play responsibly": "ብሓላፍነት ተጻወቱ",
    "Your slip is empty": "ዝርዝር ውርርድኩም ባዶ እዩ", "Continue to sign in": "ንምእታው ቀጽሉ",
  },
};
const LanguageContext = createContext<{ language: AppLanguage; setLanguage: (language: AppLanguage) => void; t: (text: string) => string }>({
  language: "en", setLanguage: () => {}, t: (text) => text,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem("edilbet-language");
    if (saved === "en" || saved === "am" || saved === "ti") setLanguage(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    window.localStorage.setItem("edilbet-language", language);
  }, [language]);
  const t = (text: string) => translations[language][text] ?? text;
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>
    {children}
    <div className="fixed right-3 top-3 z-[100]">
      <label className="sr-only" htmlFor="edilbet-language">{t("language")}</label>
      <select id="edilbet-language" aria-label={t("language")} value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)}
        className="rounded-lg border border-slate-600 bg-slate-900/95 px-2.5 py-2 text-xs font-semibold text-white shadow-lg outline-none focus:border-amber-400">
        <option value="en">English</option><option value="am">አማርኛ</option><option value="ti">ትግርኛ</option>
      </select>
    </div>
  </LanguageContext.Provider>;
}
export function useLanguage() { return useContext(LanguageContext); }
