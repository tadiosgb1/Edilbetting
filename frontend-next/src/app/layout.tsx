import type { Metadata } from "next";
import "./globals.css";

import { LanguageProvider } from "@/components/language-provider";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "EdilBet",
  description: "EdilBet sports betting and operations platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <ToastProvider>{children}</ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}