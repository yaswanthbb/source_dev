import type { Metadata } from "next";
import { Inter, Space_Grotesk, Outfit, Rubik } from "next/font/google";
import { QueryProvider } from "../providers/query-provider";
import { SnackbarProvider } from "../providers/snackbar-provider";
import { SessionSync } from "../providers/session-sync";
import { ThemeProvider } from "../providers/theme-provider";
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
  title: "KIP — Knowledge Is Power",
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
        {/* Anti-FOUC blocking script: immediately sync dark mode class before initial paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('kip_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
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
              <SessionSync />
              {children}
            </SnackbarProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
