"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@platform/shared";
import { getNiches } from "@/lib/niches";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/middleware";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export function SiteHeader({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchInputId = useId();

  const navLinks = [
    { href: `/${locale}/discover`, label: dictionary.nav.discover },
    ...getNiches(dictionary).map((n) => ({
      href: `/${locale}/${n.siteSlug}`,
      label: n.shortName,
    })),
  ];

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="shrink-0 font-serif text-lg font-semibold tracking-tight text-ink"
        >
          {brand.name}
        </Link>

        <nav
          aria-label={dictionary.nav.primary}
          className="hidden items-center gap-1 md:flex"
        >
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast ${
                  active
                    ? "text-primary"
                    : "text-ink/80 hover:bg-surface hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <form
          role="search"
          action={`/${locale}/search`}
          className="hidden max-w-xs flex-1 items-center md:flex"
        >
          <label htmlFor={searchInputId} className="sr-only">
            {dictionary.common.searchLabel}
          </label>
          <input
            id={searchInputId}
            type="search"
            name="q"
            placeholder={dictionary.common.searchPlaceholder}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:border-primary focus-visible:bg-bg"
          />
        </form>

        <div className="hidden md:block">
          <LanguageSwitcher
            locale={locale}
            label={dictionary.common.languageSwitcherLabel}
          />
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="sr-only">
            {menuOpen ? dictionary.common.closeMenu : dictionary.common.openMenu}
          </span>
          {menuOpen ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label={dictionary.nav.primaryMobile}
          className="border-t border-border px-4 py-3 md:hidden"
        >
          <form role="search" action={`/${locale}/search`} className="mb-3">
            <label htmlFor={`${searchInputId}-mobile`} className="sr-only">
              {dictionary.common.searchLabel}
            </label>
            <input
              id={`${searchInputId}-mobile`}
              type="search"
              name="q"
              placeholder={dictionary.common.searchPlaceholder}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:border-primary focus-visible:bg-bg"
            />
          </form>
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium text-ink hover:bg-surface"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-3">
            <LanguageSwitcher
              locale={locale}
              label={dictionary.common.languageSwitcherLabel}
            />
          </div>
        </nav>
      )}
    </header>
  );
}
