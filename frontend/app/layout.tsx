import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { QueryProvider } from '../providers/query-provider';
import { SnackbarProvider } from '../providers/snackbar-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KIS — Knowledge Is Power',
  description: 'Structured roadmaps, concepts, quizzes, and gamified learning.',
  icons: {
    icon: '/icon.png?v=3',
    apple: '/icon.png?v=3',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-bg text-text-primary antialiased font-sans">
        <QueryProvider>
          <SnackbarProvider>{children}</SnackbarProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
