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
  return { title: getDictionary(locale).legal.editorialPolicy.metaTitle };
}

export default async function EditorialPolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const d = dictionary.legal.editorialPolicy;
  const vars = { brand: brand.name };

  return (
    <LegalPage
      title={d.title}
      lastUpdated={d.lastUpdated}
      lastReviewedLabel={dictionary.common.lastReviewedLabel}
    >
      <h2>{d.independenceHeading}</h2>
      <p>{t(d.independenceBody, vars)}</p>

      <h2>{d.sourcingHeading}</h2>
      <p>{d.sourcingBody}</p>

      <h2>{d.aiHeading}</h2>
      <p>{d.aiBody}</p>

      <h2>{d.correctionsHeading}</h2>
      <p>{d.correctionsBody}</p>

      <h2>{d.sponsoredHeading}</h2>
      <p>{d.sponsoredBody}</p>
    </LegalPage>
  );
}
