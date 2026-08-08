import type { Metadata } from "next";
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
  return { title: getDictionary(locale).legal.privacy.metaTitle };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const d = dictionary.legal.privacy;
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

      <h2>{d.collectHeading}</h2>
      <p>{d.collectBody}</p>

      <h2>{d.minimizationHeading}</h2>
      <p>{d.minimizationBody}</p>

      <h2>{d.cookiesHeading}</h2>
      <p>{d.cookiesBody}</p>

      <h2>{d.choicesHeading}</h2>
      <p>{d.choicesBody}</p>
    </LegalPage>
  );
}
