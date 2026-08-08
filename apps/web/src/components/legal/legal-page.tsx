import type { ReactNode } from "react";

export function LegalPage({
  title,
  lastUpdated,
  lastReviewedLabel,
  children,
}: {
  title: string;
  lastUpdated: string;
  lastReviewedLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-muted">
        {lastReviewedLabel}: {lastUpdated}
      </p>
      <div className="prose-legal mt-10">{children}</div>
    </div>
  );
}
