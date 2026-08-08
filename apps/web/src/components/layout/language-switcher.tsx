"use client";

import { useId } from "react";
import { useRouter, usePathname } from "next/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n/locales";

function stripLocale(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return pathname;
}

export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const selectId = useId();

  function handleChange(next: Locale) {
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    const rest = stripLocale(pathname, locale);
    router.push(`/${next}${rest === "/" ? "" : rest}`);
  }

  return (
    <div className="relative">
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>
      <select
        id={selectId}
        value={locale}
        onChange={(e) => handleChange(e.target.value as Locale)}
        className="h-9 cursor-pointer rounded-md border border-border bg-surface px-2 text-sm text-ink transition-colors duration-fast hover:border-primary focus-visible:border-primary"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </div>
  );
}
