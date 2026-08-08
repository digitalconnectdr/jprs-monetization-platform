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
  return { title: getDictionary(locale).legal.terms.metaTitle };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const d = dictionary.legal.terms;
  const vars = { brand: brand.name };

  return (
    <LegalPage
      title={d.title}
      lastUpdated={d.lastUpdated}
      lastReviewedLabel={dictionary.common.lastReviewedLabel}
    >
      <p>
        <strong>{t(d.draftNotice, vars)}</strong>
      </p>

      <h2>{d.useHeading}</h2>
      <p>{t(d.useBody, vars)}</p>

      <h2>{d.accountsHeading}</h2>
      <p>{d.accountsBody}</p>

      <h2>{d.affiliateHeading}</h2>
      <p>
        {d.affiliateBodyPrefix}{" "}
        <Link href={`/${locale}/affiliate-disclosure`}>
          {d.affiliateLinkLabel}
        </Link>
        . {d.affiliateBodySuffix}
      </p>

      <h2>{d.liabilityHeading}</h2>
      <p>{d.liabilityBody}</p>
    </LegalPage>
  );
}
