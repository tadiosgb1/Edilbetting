"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppLanguage = "en" | "am" | "ti";
const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    language: "Language", English: "English", Amharic: "አማርኛ", Tigrigna: "ትግርኛ",
    Overview: "Overview", "My overview": "My overview", "No records to display yet.": "No records to display yet.", Admin: "Admin", Agent: "Agent", Administrator: "Administrator", "Agent account": "Agent account",
    Players: "Players", Agents: "Agents", Bets: "Bets", "Bets & Markets": "Bets & Markets", Transactions: "Transactions", Reports: "Reports", Settings: "Settings", "Wallet & Payouts": "Wallet & Payouts", Commissions: "Commissions", "My Players": "My Players",
    "Total turnover": "Total turnover", "Active players": "Active players", "Net revenue": "Net revenue", "Open bets": "Open bets", "Player portfolio": "Player portfolio", "Total stakes": "Total stakes", "Commission earned": "Commission earned", "Pending payouts": "Pending payouts", "vs last period": "vs last period",
    "Performance overview": "Performance overview", "Sample data": "Sample data", "Activity across the selected period": "Activity across the selected period", Illustrative: "Illustrative", commission: "commission", trend: "trend", "Operations health": "Operations health", "Network snapshot": "Network snapshot", "Player accounts": "Player accounts", "Active agents": "Active agents", "Settlement queue": "Settlement queue", "Payment processing": "Payment processing", "Online today": "Online today", "Awaiting payout": "Awaiting payout", "Commission tier": "Commission tier", Healthy: "Healthy", Review: "Review", Growing: "Growing", Active: "Active", Current: "Current", "Recent activity": "Recent activity", "View all": "View all", Activity: "Activity", Amount: "Amount", Status: "Status", Time: "Time", "Player deposit": "Player deposit", "Bet settlement": "Bet settlement", "Withdrawal request": "Withdrawal request", "New player registered": "New player registered", Completed: "Completed", Pending: "Pending", Verified: "Verified",
    Export: "Export", "Add player": "Add player", "Total players": "Total players", "Active this month": "Active this month", "Needs review": "Needs review", "Player directory": "Player directory", "Search players...": "Search players...", "Player ID": "Player ID", Name: "Name", Email: "Email", Balance: "Balance", Search: "Search", Filters: "Filters", "Preview data": "Preview data", API: "API", "Connect your": "Connect your", "Agents overview": "Agents overview", "Bets overview": "Bets overview", "Transactions overview": "Transactions overview", "Reports overview": "Reports overview", "Settings overview": "Settings overview", "Players overview": "Players overview",
    "Manage agent accounts, assigned networks and commission tiers.": "Manage agent accounts, assigned networks and commission tiers.", "Review bet activity, market status and settlement queues.": "Review bet activity, market status and settlement queues.", "Monitor deposits, withdrawals, payouts and payment reconciliation.": "Monitor deposits, withdrawals, payouts and payment reconciliation.", "Explore operational performance and business reports.": "Explore operational performance and business reports.", "Configure platform preferences and operational policies.": "Configure platform preferences and operational policies.", "This section is ready for live records and permission-aware actions. No live records are being displayed.": "This section is ready for live records and permission-aware actions. No live records are being displayed.",
    "Welcome back.": "Welcome back.", "Phone number": "Phone number", Password: "Password",
    "Sign in": "Sign in", "Create an account": "Create an account", "Search matches…": "Search matches…",
    Home: "Home", Sports: "Sports", Live: "Live", "Upcoming Matches": "Upcoming Matches",
    "No matches found": "No matches found", "Play responsibly": "Play responsibly",
    "Your slip is empty": "Your slip is empty", "Continue to sign in": "Continue to sign in",
  },
  am: {
    language: "ቋንቋ", English: "English", Amharic: "አማርኛ", Tigrigna: "ትግርኛ",
    Overview: "አጠቃላይ እይታ", "My overview": "የእኔ አጠቃላይ እይታ", "No records to display yet.": "እስካሁን የሚታዩ መዝገቦች የሉም።", Admin: "አስተዳዳሪ", Agent: "ወኪል", Administrator: "አስተዳዳሪ", "Agent account": "የወኪል መለያ",
    Players: "ተጫዋቾች", Agents: "ወኪሎች", Bets: "ውርርዶች", "Bets & Markets": "ውርርዶች እና ገበያዎች", Transactions: "ግብይቶች", Reports: "ሪፖርቶች", Settings: "ቅንብሮች", "Wallet & Payouts": "ዋሌት እና ክፍያዎች", Commissions: "ኮሚሽኖች", "My Players": "የእኔ ተጫዋቾች",
    "Total turnover": "ጠቅላላ የውርርድ መጠን", "Active players": "ንቁ ተጫዋቾች", "Net revenue": "የተጣራ ገቢ", "Open bets": "ክፍት ውርርዶች", "Player portfolio": "የተጫዋቾች ስብስብ", "Total stakes": "ጠቅላላ የውርርድ ገንዘብ", "Commission earned": "የተገኘ ኮሚሽን", "Pending payouts": "በመጠባበቅ ላይ ያሉ ክፍያዎች", "vs last period": "ከቀዳሚው ጊዜ ጋር",
    "Performance overview": "የአፈጻጸም አጠቃላይ እይታ", "Sample data": "ናሙና ውሂብ", "Activity across the selected period": "በተመረጠው ጊዜ ያለ እንቅስቃሴ", Illustrative: "ምሳሌያዊ", commission: "ኮሚሽን", trend: "አዝማሚያ", "Operations health": "የስራ ሁኔታ", "Network snapshot": "የኔትወርክ አጭር እይታ", "Player accounts": "የተጫዋች መለያዎች", "Active agents": "ንቁ ወኪሎች", "Settlement queue": "የማጠናቀቂያ ወረፋ", "Payment processing": "የክፍያ ሂደት", "Online today": "ዛሬ በመስመር ላይ", "Awaiting payout": "ክፍያ በመጠባበቅ ላይ", "Commission tier": "የኮሚሽን ደረጃ", Healthy: "ጤናማ", Review: "ለግምገማ", Growing: "እያደገ", Active: "ንቁ", Current: "አሁን", "Recent activity": "የቅርብ ጊዜ እንቅስቃሴ", "View all": "ሁሉንም ይመልከቱ", Activity: "እንቅስቃሴ", Amount: "መጠን", Status: "ሁኔታ", Time: "ሰዓት", "Player deposit": "የተጫዋች ተቀማጭ", "Bet settlement": "ውርርድ ማጠናቀቅ", "Withdrawal request": "የማውጣት ጥያቄ", "New player registered": "አዲስ ተጫዋች ተመዝግቧል", Completed: "ተጠናቋል", Pending: "በመጠባበቅ ላይ", Verified: "ተረጋግጧል",
    Export: "ወደ ውጭ ላክ", "Add player": "ተጫዋች ጨምር", "Total players": "ጠቅላላ ተጫዋቾች", "Active this month": "በዚህ ወር ንቁ", "Needs review": "ግምገማ ያስፈልጋል", "Player directory": "የተጫዋቾች ዝርዝር", "Search players...": "ተጫዋቾችን ፈልግ...", "Player ID": "የተጫዋች መለያ", Name: "ስም", Email: "ኢሜይል", Balance: "ቀሪ ሂሳብ", Search: "ፈልግ", Filters: "ማጣሪያዎች", "Preview data": "የቅድመ እይታ ውሂብ", API: "API", "Connect your": "ያገናኙ", "Agents overview": "የወኪሎች አጠቃላይ እይታ", "Bets overview": "የውርርዶች አጠቃላይ እይታ", "Transactions overview": "የግብይቶች አጠቃላይ እይታ", "Reports overview": "የሪፖርቶች አጠቃላይ እይታ", "Settings overview": "የቅንብሮች አጠቃላይ እይታ", "Players overview": "የተጫዋቾች አጠቃላይ እይታ",
    "Manage agent accounts, assigned networks and commission tiers.": "የወኪል መለያዎችን፣ ኔትወርኮችን እና የኮሚሽን ደረጃዎችን ያስተዳድሩ።", "Review bet activity, market status and settlement queues.": "የውርርድ እንቅስቃሴን፣ የገበያ ሁኔታን እና የማጠናቀቂያ ወረፋዎችን ይመልከቱ።", "Monitor deposits, withdrawals, payouts and payment reconciliation.": "ተቀማጭ፣ ማውጣት እና ክፍያዎችን ይከታተሉ።", "Explore operational performance and business reports.": "የስራ አፈጻጸምን እና ሪፖርቶችን ይመልከቱ።", "Configure platform preferences and operational policies.": "የመድረክ ምርጫዎችን እና የስራ መመሪያዎችን ያዘጋጁ።", "This section is ready for live records and permission-aware actions. No live records are being displayed.": "ይህ ክፍል ለቀጥታ መዝገቦች ዝግጁ ነው። አሁን ቀጥታ መዝገቦች አይታዩም።",
    "Welcome back.": "እንኳን ደህና መጡ።", "Phone number": "ስልክ ቁጥር", Password: "የይለፍ ቃል",
    "Sign in": "ግባ", "Create an account": "መለያ ፍጠር", "Search matches…": "ጨዋታዎችን ፈልግ…",
    Home: "መነሻ", Sports: "ስፖርቶች", Live: "በቀጥታ", "Upcoming Matches": "መጪ ጨዋታዎች",
    "No matches found": "ምንም ጨዋታ አልተገኘም", "Play responsibly": "በኃላፊነት ይጫወቱ",
    "Your slip is empty": "የውርርድ ዝርዝርዎ ባዶ ነው", "Continue to sign in": "ለመግባት ይቀጥሉ",
  },
  ti: {
    language: "ቋንቋ", English: "English", Amharic: "ኣማርኛ", Tigrigna: "ትግርኛ",
    Overview: "ሓፈሻዊ ትሕዝቶ", "My overview": "ሓፈሻዊ ትሕዝቶይ", "No records to display yet.": "ክሳብ ሕጂ ዝርአ መዝገብ የለን።", Admin: "ኣስተዳዳሪ", Agent: "ወኪል", Administrator: "ኣስተዳዳሪ", "Agent account": "ሕሳብ ወኪል",
    Players: "ተጻወትቲ", Agents: "ወከልቲ", Bets: "ውርርድ", "Bets & Markets": "ውርርድን ዕዳጋታትን", Transactions: "ልውውጣት", Reports: "ጸብጻባት", Settings: "ቅንብራት", "Wallet & Payouts": "ዋሌትን ክፍሊታትን", Commissions: "ኮሚሽን", "My Players": "ተጻወትተይ",
    "Total turnover": "ጠቕላላ ውርርድ", "Active players": "ንጡፋት ተጻወትቲ", "Net revenue": "ጽሩይ ኣታዊ", "Open bets": "ክፉት ውርርድ", "Player portfolio": "ስብስብ ተጻወትቲ", "Total stakes": "ጠቕላላ ውርርድ ገንዘብ", "Commission earned": "ዝተረኽበ ኮሚሽን", "Pending payouts": "ዝጽበዩ ክፍሊታት", "vs last period": "ምስ ዝሓለፈ ግዜ",
    "Performance overview": "ሓፈሻዊ ኣፈጻጽማ", "Sample data": "ናሙና ዳታ", "Activity across the selected period": "ኣብ ዝተመርጸ ግዜ ዝነበረ ንጥፈት", Illustrative: "ኣብነታዊ", commission: "ኮሚሽን", trend: "ኣንፈት", "Operations health": "ኩነታት ስራሕ", "Network snapshot": "ሓፈሻዊ ስእሊ ኔትወርክ", "Player accounts": "ሕሳባት ተጻወትቲ", "Active agents": "ንጡፋት ወከልቲ", "Settlement queue": "መስርዕ ምዝዛም", "Payment processing": "መስርሕ ክፍሊት", "Online today": "ሎሚ ኣብ መስመር ዘለዉ", "Awaiting payout": "ክፍሊት ዝጽበ", "Commission tier": "ደረጃ ኮሚሽን", Healthy: "ጥዑይ", Review: "ግምገማ", Growing: "ይዓቢ ኣሎ", Active: "ንጡፍ", Current: "እዋናዊ", "Recent activity": "ናይ ቀረባ ንጥፈት", "View all": "ኩሉ ርአ", Activity: "ንጥፈት", Amount: "መጠን", Status: "ኩነታት", Time: "ግዜ", "Player deposit": "ተቐማጢ ተጻዋታይ", "Bet settlement": "ምዝዛም ውርርድ", "Withdrawal request": "ሕቶ ምውጻእ", "New player registered": "ሓድሽ ተጻዋታይ ተመዝጊቡ", Completed: "ተዛዚሙ", Pending: "ይጽበ ኣሎ", Verified: "ተረጋጊጹ",
    Export: "ኣውጽእ", "Add player": "ተጻዋታይ ወስኽ", "Total players": "ጠቕላላ ተጻወትቲ", "Active this month": "ኣብዚ ወርሒ ንጡፋት", "Needs review": "ግምገማ የድሊ", "Player directory": "ዝርዝር ተጻወትቲ", "Search players...": "ተጻወትቲ ድለ...", "Player ID": "መለለዪ ተጻዋታይ", Name: "ስም", Email: "ኢመይል", Balance: "ቀሪ ሕሳብ", Search: "ድለ", Filters: "መጻረዪታት", "Preview data": "ናይ ቅድመ ርኢቶ ዳታ", API: "API", "Connect your": "ኣራኽብ", "Agents overview": "ሓፈሻዊ ትሕዝቶ ወከልቲ", "Bets overview": "ሓፈሻዊ ትሕዝቶ ውርርድ", "Transactions overview": "ሓፈሻዊ ትሕዝቶ ልውውጣት", "Reports overview": "ሓፈሻዊ ትሕዝቶ ጸብጻባት", "Settings overview": "ሓፈሻዊ ትሕዝቶ ቅንብራት", "Players overview": "ሓፈሻዊ ትሕዝቶ ተጻወትቲ",
    "Manage agent accounts, assigned networks and commission tiers.": "ሕሳባት ወኪል፣ ኔትወርክን ደረጃታት ኮሚሽንን ኣመሓድር።", "Review bet activity, market status and settlement queues.": "ንጥፈት ውርርድ፣ ኩነታት ዕዳጋን መስርዕ ምዝዛምን ርአ።", "Monitor deposits, withdrawals, payouts and payment reconciliation.": "ተቐማጢ፣ ምውጻእን ክፍሊታትን ተኸታተል።", "Explore operational performance and business reports.": "ኣፈጻጽማ ስራሕን ጸብጻባትን ርአ።", "Configure platform preferences and operational policies.": "ምርጫታት መድረኽን መምርሒታት ስራሕን ኣዳሉ።", "This section is ready for live records and permission-aware actions. No live records are being displayed.": "እዚ ክፍሊ ንቀጥታ መዝገባት ድሉው እዩ። ሕጂ ቀጥታ መዝገባት ኣይርኣዩን።",
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
  </LanguageContext.Provider>;
}
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return <div className="flex items-center gap-2">
    <label className="sr-only" htmlFor="edilbet-language">{t("language")}</label>
    <select id={compact ? "edilbet-language-compact" : "edilbet-language"} aria-label={t("language")} value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)}
      className="max-w-full rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs font-semibold text-white shadow-sm outline-none focus:border-amber-400">
      <option value="en">English</option><option value="am">አማርኛ</option><option value="ti">ትግርኛ</option>
    </select>
  </div>;
}
export function useLanguage() { return useContext(LanguageContext); }
