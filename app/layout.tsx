import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DOSTEAM HUB",
  description: "Единая цифровая экосистема студенческой жизни ЕАГИ: клубы, события, достижения и возможности.",
  openGraph: {
    title: "DOSTEAM HUB",
    description: "Студенческая жизнь ЕАГИ — в одном месте",
    images: ["https://dosteam-hub.kemelbekov.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "DOSTEAM HUB",
    description: "Студенческая жизнь ЕАГИ — в одном месте",
    images: ["https://dosteam-hub.kemelbekov.chatgpt.site/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
