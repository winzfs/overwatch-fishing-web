import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./mobile-scale.css";
import MobileViewportFix from "./components/MobileViewportFix";

export const metadata: Metadata = {
  title: "Overwatch Fishing MMO",
  description: "낚시, 항구 경영, 다이빙 탐사, 길드 원정을 결합한 바다 생활 RPG",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <MobileViewportFix />
        {children}
      </body>
    </html>
  );
}
