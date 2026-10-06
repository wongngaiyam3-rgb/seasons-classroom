import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "地球觀察站｜日與夜・四季",
  description: "選擇日與夜或四季，利用互動地球模型探索自轉、公轉與陽光照射。",
  other: {
    "codex-preview": "development",
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
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
