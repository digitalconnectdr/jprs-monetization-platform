import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "../globals.css";

/**
 * `/admin` no vive bajo `[locale]` (herramienta interna de un solo idioma, ver
 * docs/phases/P409_AUTH_DASHBOARD.md) — no hay un `app/layout.tsx` raíz compartido
 * con el shell público, así que este layout provee su propio `<html>/<body>`.
 */
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body className="min-h-screen bg-bg text-ink">{children}</body>
    </html>
  );
}
