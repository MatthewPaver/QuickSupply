import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { CookieBanner } from "@/components/shared/cookie-banner";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickSupply | Desian Education",
  description:
    "A demo of same-day supply cover booking for schools, supply agencies and supply teachers. All data is fictional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4c0673" />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <OfflineBanner />
        {children}
        <Toaster position="top-right" richColors />
        <CookieBanner />
        <PwaInstallPrompt />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
