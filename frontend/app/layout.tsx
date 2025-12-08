import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Homeground | 동네 생활 아카이브",
  description: "공간 예약, 모임 일정, 동네 이야기를 한 곳에서 관리하는 Homeground.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSans.variable}>
      <body className="bg-brand-bg text-brand-ink antialiased selection:bg-brand-accent selection:text-white">
        {children}
      </body>
    </html>
  );
}
