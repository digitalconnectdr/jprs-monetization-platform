"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createPublicSupabaseClient, recordPageView } from "@platform/db";
import { nicheStructures } from "@/lib/niches";

const SESSION_STORAGE_KEY = "decidero_session_id";
const KNOWN_SITE_SLUGS = new Set(nicheStructures.map((n) => n.siteSlug));

function getOrCreateSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}

/** Segundo segmento (/{locale}/{siteSlug}/...) solo si coincide con un site real conocido — distingue rutas de vertical (software-ai, travel, consumer-tech) de rutas del shell (discover, about, search, ...). */
function siteSlugFromPathname(pathname: string): string | null {
  const segment = pathname.split("/")[2];
  return segment && KNOWN_SITE_SLUGS.has(segment) ? segment : null;
}

/** Emite page_view real en cada navegación (Fase 7, backlog 701) — sin cookies de terceros, sin PII. */
export function AnalyticsBeacon({ locale }: { locale: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const client = createPublicSupabaseClient();
    recordPageView(client, { path: pathname, locale, siteSlug: siteSlugFromPathname(pathname), sessionId }).catch(() => {
      // Best-effort: un fallo de telemetría nunca debe afectar la navegación del visitante.
    });
  }, [pathname, locale]);

  return null;
}
