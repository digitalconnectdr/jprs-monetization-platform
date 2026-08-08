export const locales = ["en", "es", "pt", "hi", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  hi: "हिन्दी",
  fr: "Français",
};
