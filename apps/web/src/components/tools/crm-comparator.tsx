"use client";

import { useState } from "react";
import type { ProductDetail } from "@platform/db";
import { formatPrice } from "@/lib/catalog-price";

export function CrmComparator({
  products,
  locale,
  labels,
}: {
  products: ProductDetail[];
  locale: string;
  labels: {
    selectToCompare: string;
    entryPlanColumn: string;
    priceColumn: string;
    freeTierColumn: string;
    billingModelColumn: string;
    integrationsColumn: string;
    swipeToCompare: string;
    noSelection: string;
    sourceLabel: string;
  };
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(products.map((p) => p.id)));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedProducts = products.filter((p) => selected.has(p.id));

  function featureValue(product: ProductDetail, key: string): string | null {
    return product.features.find((f) => f.featureKey === key)?.featureValue ?? null;
  }

  return (
    <div>
      <fieldset className="flex flex-wrap gap-3">
        <legend className="sr-only">{labels.selectToCompare}</legend>
        {products.map((product) => (
          <label
            key={product.id}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
          >
            <input
              type="checkbox"
              checked={selected.has(product.id)}
              onChange={() => toggle(product.id)}
              className="h-4 w-4"
            />
            {product.name}
          </label>
        ))}
      </fieldset>

      {selectedProducts.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{labels.noSelection}</p>
      ) : (
        <>
          <p className="mt-6 text-xs text-muted md:hidden">{labels.swipeToCompare}</p>
          <div className="mt-3 overflow-x-auto md:mt-8">
            <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-semibold text-ink"> </th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.entryPlanColumn}</th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.priceColumn}</th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.freeTierColumn}</th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.billingModelColumn}</th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.integrationsColumn}</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((product) => (
                <tr key={product.id} className="border-b border-border">
                  <td className="py-3 pr-4 font-medium text-ink">{product.name}</td>
                  <td className="py-3 pr-4 text-ink">{featureValue(product, "entry_plan_name") ?? "—"}</td>
                  <td className="py-3 pr-4 text-ink">
                    {product.latestPrice ? `${formatPrice(product.latestPrice.amount, product.latestPrice.currency, locale)}/mo` : "—"}
                  </td>
                  <td className="py-3 pr-4 text-ink">{featureValue(product, "free_tier") ?? "—"}</td>
                  <td className="py-3 pr-4 text-ink">{featureValue(product, "billing_model") ?? "—"}</td>
                  <td className="py-3 pr-4 text-ink">{featureValue(product, "marketplace_integrations") ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
