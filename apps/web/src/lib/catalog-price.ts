import type { Dictionary } from "./i18n/dictionary";

/**
 * `product_prices.price_type` (Fase 4) incluye tipos no recurrentes ('list', 'sale',
 * 'starting_at') además de suscripciones — mostrar siempre "/month" (como hacía el
 * template hasta Fase 6B) es una afirmación falsa para catálogos no-SaaS (ej. planes
 * eSIM de Fase 6B, price_type='starting_at').
 */
export function priceSuffix(dictionary: Dictionary, priceType: string): string {
  if (priceType === "subscription_monthly") return dictionary.catalog.perMonth;
  if (priceType === "subscription_yearly") return dictionary.catalog.perYear;
  return "";
}
