import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "게시판 서비스",
  description: "Ktor + Next.js로 만든 게시판 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
