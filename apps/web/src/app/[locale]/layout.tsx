import type { Metadata } from "next";
import { Source_Serif_4, Public_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { brand } from "@platform/shared";
import { getSiteUrl, organizationSchema, websiteSchema } from "@platform/seo";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { locales, type Locale } from "@/lib/i18n/locales";
import "../globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: brand.name,
    template: `%s — ${brand.name}`,
  },
  description: brand.tagline,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  const dictionary = getDictionary(locale);

  const orgSchema = organizationSchema({ name: brand.name, description: brand.tagline });
  const siteSchema = websiteSchema({ name: brand.name });

  return (
    <html lang={locale} className={`${sourceSerif.variable} ${publicSans.variable}`}>
      <body className="flex min-h-screen flex-col">
        {/*
          Verificación de dominio para el registro del propietario funcional en
          Impact.com (backlog 608/618/628 — afiliados reales). El snippet exigido por
          Impact.com usa el atributo `value`, no `content` — la Metadata API de
          Next.js (`metadata.other`) fuerza `content`, así que se renderiza el tag
          crudo aquí; React 19 lo hoistea a <head> automáticamente. Sitewide para que
          aparezca sin importar el locale en el que aterrice el crawler.
        */}
        <meta
          {...({ name: "impact-site-verification", value: "5f73e1e5-eb8e-4ad9-8707-47d51b4109c2" } as React.MetaHTMLAttributes<HTMLMetaElement>)}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
        <AnalyticsBeacon locale={locale} />
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-tooltip focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-primary-ink"
        >
          {dictionary.common.skipToContent}
        </a>
        <SiteHeader locale={locale} dictionary={dictionary} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale} dictionary={dictionary} />
      </body>
    </html>
  );
}
