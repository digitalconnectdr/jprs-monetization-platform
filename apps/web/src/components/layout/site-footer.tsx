import Link from "next/link";
import { brand } from "@platform/shared";
import { getNiches } from "@/lib/niches";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/middleware";

export function SiteFooter({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const year = new Date().getFullYear();
  const niches = getNiches(dictionary);

  const legalLinks = [
    { href: `/${locale}/about`, label: dictionary.footer.legal.about },
    {
      href: `/${locale}/editorial-policy`,
      label: dictionary.footer.legal.editorialPolicy,
    },
    {
      href: `/${locale}/affiliate-disclosure`,
      label: dictionary.footer.legal.affiliateDisclosure,
    },
    { href: `/${locale}/privacy`, label: dictionary.footer.legal.privacy },
    { href: `/${locale}/terms`, label: dictionary.footer.legal.terms },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Link
            href={`/${locale}`}
            className="font-serif text-lg font-semibold tracking-tight text-ink"
          >
            {brand.name}
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            {dictionary.footer.taglineSuffix}
          </p>
        </div>

        <nav aria-label={dictionary.footer.verticalsHeading}>
          <h2 className="text-sm font-semibold text-ink">
            {dictionary.footer.verticalsHeading}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {niches.map((n) => (
              <li key={n.slug}>
                <Link
                  href={`/${locale}/${n.siteSlug}`}
                  className="text-sm text-muted transition-colors duration-fast hover:text-ink"
                >
                  {n.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={dictionary.footer.legalHeading}>
          <h2 className="text-sm font-semibold text-ink">
            {dictionary.footer.legalHeading}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted transition-colors duration-fast hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted sm:px-6">
          © {year} {brand.name}. {dictionary.footer.copyrightPrefix}{" "}
          <Link
            href={`/${locale}/affiliate-disclosure`}
            className="underline underline-offset-2"
          >
            {dictionary.footer.copyrightLinkLabel}
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
