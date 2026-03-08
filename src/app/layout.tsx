import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcus",
  description: "Your intelligent AI workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script src="https://js.puter.com/v2/" defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
