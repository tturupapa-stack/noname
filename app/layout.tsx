import type { Metadata, Viewport } from "next";
import { Gowun_Dodum, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeTransition from "@/components/ThemeTransition";

// Gowun Dodum - 둥글고 친근한 한국어 폰트 (헤드라인용)
const gowunDodum = Gowun_Dodum({
  variable: "--font-gowun-dodum",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// IBM Plex Sans KR - 깔끔하고 부드러운 본문용
const ibmPlexSansKR = IBM_Plex_Sans_KR({
  variable: "--font-ibm-plex-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "당신이 잠든 사이",
  description: "밤새 시장에서 무슨 일이 있었는지, 새벽이 밝아올 때 알려드립니다",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "잠든사이",
  },
  icons: {
    apple: "/icon-180.png",
  },
  keywords: ["주식", "브리핑", "대시보드", "화제 종목", "시장 분석"],
  authors: [{ name: "잠든사이" }],
  openGraph: {
    title: "당신이 잠든 사이",
    description: "밤새 시장에서 무슨 일이 있었는지, 새벽이 밝아올 때 알려드립니다",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a12" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="잠든사이" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const resolvedTheme = theme === 'system' || !theme ? systemTheme : theme;
                  document.documentElement.classList.add(resolvedTheme);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${gowunDodum.variable} ${ibmPlexSansKR.variable} antialiased`}
        style={{ fontFamily: "var(--font-ibm-plex-kr), system-ui, sans-serif" }}
      >
        <ThemeProvider>
          <ThemeTransition />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
