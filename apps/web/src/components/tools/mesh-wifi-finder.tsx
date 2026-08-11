"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductDetail } from "@platform/db";

type FinderLabels = {
  requireWifi7: string;
  requireMultiGig: string;
  requireSmartHomeHub: string;
  matchingProductsHeading: string;
  noMatchingProducts: string;
  finderMethodology: string;
  viewDetails: string;
};

function includesFeature(product: ProductDetail, key: string, expected: string): boolean {
  const value = product.features.find((feature) => feature.featureKey === key)?.featureValue;
  return value?.toLocaleLowerCase().includes(expected.toLocaleLowerCase()) ?? false;
}

export function MeshWifiFinder({
  products,
  locale,
  site,
  category,
  labels,
}: {
  products: ProductDetail[];
  locale: string;
  site: string;
  category: string;
  labels: FinderLabels;
}) {
  const [requiresWifi7, setRequiresWifi7] = useState(false);
  const [requiresMultiGig, setRequiresMultiGig] = useState(false);
  const [requiresSmartHomeHub, setRequiresSmartHomeHub] = useState(false);

  const matches = products.filter((product) => {
    if (requiresWifi7 && !includesFeature(product, "wifi_standard", "Wi-Fi 7")) return false;
    if (requiresMultiGig && !includesFeature(product, "multi_gig_ethernet", "yes")) return false;
    if (requiresSmartHomeHub && !includesFeature(product, "smart_home_hub", "yes")) return false;
    return true;
  });

  return (
    <div>
      <fieldset className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
        <legend className="sr-only">{labels.matchingProductsHeading}</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={requiresWifi7} onChange={() => setRequiresWifi7((value) => !value)} className="h-4 w-4" />
          {labels.requireWifi7}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={requiresMultiGig} onChange={() => setRequiresMultiGig((value) => !value)} className="h-4 w-4" />
          {labels.requireMultiGig}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={requiresSmartHomeHub} onChange={() => setRequiresSmartHomeHub((value) => !value)} className="h-4 w-4" />
          {labels.requireSmartHomeHub}
        </label>
      </fieldset>

      <section aria-live="polite" aria-labelledby="mesh-matches-heading" className="mt-8">
        <h2 id="mesh-matches-heading" className="font-serif text-xl font-semibold text-ink">
          {labels.matchingProductsHeading}
        </h2>
        {matches.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-muted">{labels.noMatchingProducts}</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-border border-y border-border">
            {matches.map((product) => (
              <li key={product.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{product.name}</p>
                  {product.latestPrice && <p className="mt-1 text-sm text-muted">${product.latestPrice.amount.toFixed(2)}</p>}
                </div>
                <Link
                  href={`/${locale}/${site}/${category}/${product.slug}`}
                  className="text-sm font-medium text-ink underline underline-offset-2"
                >
                  {labels.viewDetails}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-xs leading-relaxed text-muted">{labels.finderMethodology}</p>
    </div>
  );
}
