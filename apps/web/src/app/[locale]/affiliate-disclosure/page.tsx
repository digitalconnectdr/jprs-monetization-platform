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
  return { title: getDictionary(locale).legal.affiliateDisclosure.metaTitle };
}

export default async function AffiliateDisclosurePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const d = dictionary.legal.affiliateDisclosure;
  const vars = { brand: brand.name };

  return (
    <LegalPage
      title={d.title}
      lastUpdated={d.lastUpdated}
      lastReviewedLabel={dictionary.common.lastReviewedLabel}
    >
      <h2>{d.howHeading}</h2>
      <p>{t(d.howBody, vars)}</p>

      <h2>{d.whatNotHeading}</h2>
      <p>
        {d.whatNotBodyPrefix}{" "}
        <Link href={`/${locale}/about`}>{d.whatNotLinkLabel}</Link>
        {d.whatNotBodySuffix}
      </p>

      <h2>{d.sponsoredHeading}</h2>
      <p>{d.sponsoredBody}</p>

      <h2>{d.identifyingHeading}</h2>
      <p>{d.identifyingBody}</p>
    </LegalPage>
  );
}
