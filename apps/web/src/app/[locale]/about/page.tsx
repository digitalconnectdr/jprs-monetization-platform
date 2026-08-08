import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@platform/shared";
import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/middleware";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).legal.about.metaTitle };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const d = dictionary.legal.about;
  const vars = { brand: brand.name };

  return (
    <LegalPage
      title={d.title}
      lastUpdated={d.lastUpdated}
      lastReviewedLabel={dictionary.common.lastReviewedLabel}
    >
      <h2>{t(d.whatIsHeading, vars)}</h2>
      <p>{t(d.whatIsBody, vars)}</p>

      <h2>{d.scoringHeading}</h2>
      <p>
        {d.scoringBodyPrefix}{" "}
        <Link href={`/${locale}/editorial-policy`}>{d.scoringLinkLabel}</Link>
        {d.scoringBodySuffix}
      </p>

      <h2>{d.sourcesHeading}</h2>
      <p>{d.sourcesBody}</p>

      <h2>{d.dontHeading}</h2>
      <ul>
        <li>{d.dontItems[0]}</li>
        <li>{d.dontItems[1]}</li>
        <li>
          {d.dontAffiliateItemPrefix}{" "}
          <Link href={`/${locale}/affiliate-disclosure`}>
            {d.dontAffiliateLinkLabel}
          </Link>
          .
        </li>
        <li>{d.dontItems[2]}</li>
      </ul>
    </LegalPage>
  );
}
