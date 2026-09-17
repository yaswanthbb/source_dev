import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Space_Grotesk, Outfit, Rubik } from "next/font/google";
import { QueryProvider } from "../providers/query-provider";
import { SnackbarProvider } from "../providers/snackbar-provider";
import { SessionSync } from "../providers/session-sync";
import { ThemeProvider } from "../providers/theme-provider";
import { UiModeProvider } from "../providers/ui-mode-provider";
import { ScrollProgressBar } from "@/components/scroll-progress-bar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "source:dev",
  description: "Structured roadmaps, concepts, quizzes, and gamified learning.",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${outfit.variable} ${rubik.variable}`}
    >
      <head>
        {/* Anti-FOUC blocking script: sync dark mode and interface mode onto
            the document before first paint, so neither the palette nor the
            mode flashes the wrong value on a reload. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('sd_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                var mode = localStorage.getItem('sd_ui_mode');
                document.documentElement.dataset.uiMode =
                  mode === 'cli' ? 'cli' : 'gui';
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg text-text-primary antialiased font-sans">
        <ScrollProgressBar />
        <ThemeProvider>
          <QueryProvider>
            <SnackbarProvider>
              {/* UiModeProvider reads the CLI location out of the query
                  string, so it sits inside Suspense: useSearchParams suspends
                  up to the nearest boundary during prerendering. */}
              <Suspense fallback={null}>
                <UiModeProvider>
                  <SessionSync />
                  {children}
                </UiModeProvider>
              </Suspense>
            </SnackbarProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
