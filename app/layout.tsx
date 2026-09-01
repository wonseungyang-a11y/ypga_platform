import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { getSiteMenuItems } from "@/lib/site-menu";
import "./globals.css";

/** 한글·라틴 모두 안정적으로 표시 */
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-kr",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YPGA",
  description:
    "YPGA(Yonsei Posung Golf Academy) — 연세대학교 · 보성고등학교(POSUNG) 동문 골프 모임. 회원, 대회, 조편성, 자료실",
};

/** 메뉴는 Supabase/파일에서 읽음 — 정적 프리렌더 시 예전 메뉴가 고정되지 않도록 */
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const menuLinks = await getSiteMenuItems();

  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={`${notoSansKr.className} flex min-h-full flex-col bg-surface text-foreground dark:bg-zinc-950`}
      >
        <SiteNav links={menuLinks} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
