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

/**
 * Formatea un monto con el símbolo/código de SU PROPIA moneda — nunca asumir USD.
 * El catálogo no está garantizado a ser 100% USD (ej. n8n se cotiza en EUR en su
 * propia página de precios, backlog 607); hardcodear "$" mostraría un monto en EUR
 * como si fuera USD, una afirmación de precio falsa.
 */
export function formatPrice(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(amount);
  } catch {
    // currency de 3 letras no reconocida por Intl (no debería pasar dado el CHECK de
    // la columna, pero degrada de forma segura en vez de lanzar).
    return `${amount.toFixed(2)} ${currency}`;
  }
}
