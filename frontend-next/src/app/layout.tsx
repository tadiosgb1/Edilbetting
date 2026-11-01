import type { Metadata } from "next";
import "./globals.css";
<<<<<<< HEAD

=======
>>>>>>> 561ac358794c1c6916f86d4fd1bb0ac4e74362aa
import { LanguageProvider } from "@/components/language-provider";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "EdilBet | Sportsbook & Operations",
  description: "EdilBet sports betting and operations platform",
};

<<<<<<< HEAD
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
=======
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><ToastProvider><LanguageProvider>{children}</LanguageProvider></ToastProvider></body></html>;
}
>>>>>>> 561ac358794c1c6916f86d4fd1bb0ac4e74362aa
