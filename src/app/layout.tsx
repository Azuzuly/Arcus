import type { Metadata, Viewport } from "next";
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import "./globals.css";

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Arcus',
    template: '%s — Arcus',
  },
  description: 'Your intelligent AI workspace. Chat with 500+ models, generate images, build AI workflows.',
  keywords: ['AI', 'chat', 'GPT', 'Claude', 'Gemini', 'AI workspace', 'liquid glass', 'Arcus'],
  authors: [{ name: 'Arcus' }],
  openGraph: {
    title: 'Arcus — AI Workspace',
    description: 'Chat with 500+ AI models, generate images, and build intelligent workflows.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arcus — AI Workspace',
    description: 'Chat with 500+ AI models, generate images, and build intelligent workflows.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050508',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>%E2%97%86</text></svg>" />
        <script src="https://js.puter.com/v2/" defer></script>
      </head>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
