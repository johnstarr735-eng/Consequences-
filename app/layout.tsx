import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./play-improvements.css";

export const metadata: Metadata = {
  title: "Consequences — One intention. A world changed.",
  description: "A two-player text simulation rooted in the notebooks and the DESTINY engine. Commit your intention and encounter a world changed.",
  manifest: '/manifest.webmanifest',
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Consequences' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#111b18' };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
