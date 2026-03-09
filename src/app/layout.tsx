import type { Metadata } from "next";
import { Geist, Geist_Mono } from 'next/font/google';
import "./globals.css";
import 'katex/dist/katex.min.css';

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
  title: "Arcus",
  description: "Your intelligent AI workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://js.puter.com/v2/" defer></script>
      </head>
      <body className={`${geist.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
