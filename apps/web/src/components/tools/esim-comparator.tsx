"use client";

import { useState } from "react";
import type { ProductDetail } from "@platform/db";

export function EsimComparator({
  products,
  labels,
}: {
  products: ProductDetail[];
  labels: {
    selectToCompare: string;
    entryPlanColumn: string;
    priceColumn: string;
    dataModelColumn: string;
    largestPlanColumn: string;
    coverageColumn: string;
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
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-semibold text-ink"> </th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.entryPlanColumn}</th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.priceColumn}</th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.dataModelColumn}</th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.largestPlanColumn}</th>
                <th className="py-2 pr-4 font-semibold text-ink">{labels.coverageColumn}</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((product) => (
                <tr key={product.id} className="border-b border-border">
                  <td className="py-3 pr-4 font-medium text-ink">{product.name}</td>
                  <td className="py-3 pr-4 text-ink">{featureValue(product, "entry_plan") ?? "—"}</td>
                  <td className="py-3 pr-4 text-ink">
                    {product.latestPrice ? `$${product.latestPrice.amount.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-3 pr-4 text-ink">{featureValue(product, "data_model") ?? "—"}</td>
                  <td className="py-3 pr-4 text-ink">{featureValue(product, "largest_plan") ?? "—"}</td>
                  <td className="py-3 pr-4 text-ink">{featureValue(product, "coverage") ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
