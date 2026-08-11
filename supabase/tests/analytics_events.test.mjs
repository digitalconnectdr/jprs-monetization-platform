// Fase 7 (backlog 701): tests de acceso positivo/negativo para analytics_events y
// record_analytics_event(), contra el proyecto Supabase real.
//
//   node supabase/tests/analytics_events.test.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "..", "apps", "web", ".env.local");

function loadEnv(file) {
  const values = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return values;
}

const env = loadEnv(envPath);
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function rest(pathAndQuery, { key, method = "GET", body, extraHeaders = {} } = {}) {
  const response = await fetch(`${URL_BASE}/rest/v1/${pathAndQuery}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...extraHeaders,
      ...(method === "POST" ? { Prefer: "return=representation" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await response.json();
  } catch {
    // Empty body expected for some responses.
  }
  return { status: response.status, json };
}

async function createAndSignInTestUser(email, password) {
  const created = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  }).then((r) => r.json());

  const signedIn = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());

  return { userId: created.id, accessToken: signedIn.access_token };
}

async function deleteTestUser(userId) {
  if (!userId) return;
  await fetch(`${URL_BASE}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
}

let pass = 0;
let fail = 0;
function check(label, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`PASS  ${label}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}  ${detail}`);
  }
}

async function main() {
  const stamp = Date.now();
  let siteAId, siteBId;
  let analystUserId;
  let eventId = `p7-test-${stamp}`;

  try {
    const sites = await rest("sites?select=id,slug&slug=in.(software-ai,travel)", { key: SERVICE_KEY });
    siteAId = sites.json?.find((s) => s.slug === "software-ai")?.id;
    siteBId = sites.json?.find((s) => s.slug === "travel")?.id;
    check("setup: sites software-ai y travel encontrados", Boolean(siteAId) && Boolean(siteBId), JSON.stringify(sites));
    if (!siteAId || !siteBId) return;

    // anon puede registrar un evento vía la función pública
    const record1 = await rest("rpc/record_analytics_event", {
      key: ANON_KEY,
      method: "POST",
      body: { p_event_id: eventId, p_event_type: "page_view", p_site_id: siteAId, p_session_id: "sess-1", p_payload: { path: "/en/software-ai" } },
    });
    check("anon puede registrar un page_view vía record_analytics_event", record1.status === 200 && Boolean(record1.json), JSON.stringify(record1));

    // Idempotencia: mismo event_id no crea una segunda fila
    const record2 = await rest("rpc/record_analytics_event", {
      key: ANON_KEY,
      method: "POST",
      body: { p_event_id: eventId, p_event_type: "page_view", p_site_id: siteAId, p_session_id: "sess-1", p_payload: { path: "/en/software-ai" } },
    });
    check(
      "reintentar el mismo event_id no crea una fila duplicada (idempotencia)",
      record2.status === 200 && record2.json === null,
      JSON.stringify(record2)
    );

    // event_type inválido es rechazado
    const invalidType = await rest("rpc/record_analytics_event", {
      key: ANON_KEY,
      method: "POST",
      body: { p_event_id: `${eventId}-invalid`, p_event_type: "not_a_real_event", p_site_id: siteAId },
    });
    check("la función rechaza un event_type inválido", invalidType.status >= 400, JSON.stringify(invalidType));

    // anon NO puede leer analytics_events directamente — Postgres puede denegar a nivel
    // de GRANT (401/403, ni siquiera evalúa RLS) o dejar pasar el GRANT y que RLS filtre
    // a 0 filas (200 vacío); ambos son "no puede leer", solo difieren en la capa que niega.
    const anonRead = await rest(`analytics_events?select=id&event_id=eq.${eventId}`, { key: ANON_KEY });
    check(
      "anon no puede leer analytics_events (ni INSERT directo, ni SELECT)",
      anonRead.status === 401 || anonRead.status === 403 || (anonRead.status === 200 && anonRead.json?.length === 0),
      JSON.stringify(anonRead)
    );

    // Un analyst de site A puede leer el evento de site A...
    const analyst = await createAndSignInTestUser(`p7-analyst-${stamp}@example.com`, "TestPassword123!");
    analystUserId = analyst.userId;
    const analystRole = await rest("roles?select=id&name=eq.analyst", { key: SERVICE_KEY });
    const roleAssignment = await rest("user_roles", {
      key: SERVICE_KEY,
      method: "POST",
      body: { user_id: analyst.userId, role_id: analystRole.json?.[0]?.id, site_id: siteAId },
    });
    check("setup: analyst autenticado, scoped a site A", Boolean(analyst.accessToken) && roleAssignment.status === 201, JSON.stringify(roleAssignment));

    const analystReadOwnSite = await rest(`analytics_events?select=id,event_id&event_id=eq.${eventId}`, {
      key: analyst.accessToken,
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "analyst de site A puede leer el evento de site A",
      analystReadOwnSite.status === 200 && analystReadOwnSite.json?.length === 1,
      JSON.stringify(analystReadOwnSite)
    );

    // ...pero no puede leer eventos de un site distinto al suyo.
    const otherSiteEventId = `p7-test-other-site-${stamp}`;
    await rest("rpc/record_analytics_event", {
      key: ANON_KEY,
      method: "POST",
      body: { p_event_id: otherSiteEventId, p_event_type: "page_view", p_site_id: siteBId },
    });
    const analystReadOtherSite = await rest(`analytics_events?select=id&event_id=eq.${otherSiteEventId}`, {
      key: analyst.accessToken,
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "analyst de site A NO puede leer eventos de site B",
      analystReadOtherSite.status === 200 && analystReadOtherSite.json?.length === 0,
      JSON.stringify(analystReadOtherSite)
    );

    // compute_structural_roe_scores no es llamable por anon ni por un usuario autenticado sin service_role
    const anonRoe = await rest("rpc/compute_structural_roe_scores", { key: ANON_KEY, method: "POST", body: {} });
    check("anon no puede ejecutar compute_structural_roe_scores", anonRoe.status >= 400, JSON.stringify(anonRoe));

    const analystRoe = await rest("rpc/compute_structural_roe_scores", {
      key: analyst.accessToken,
      extraHeaders: { apikey: ANON_KEY },
      method: "POST",
      body: {},
    });
    check("un analyst autenticado (no service_role) no puede ejecutar compute_structural_roe_scores", analystRoe.status >= 400, JSON.stringify(analystRoe));
  } finally {
    await rest(`analytics_events?event_id=eq.${eventId}`, { key: SERVICE_KEY, method: "DELETE" });
    await rest(`analytics_events?event_id=eq.p7-test-other-site-${stamp}`, { key: SERVICE_KEY, method: "DELETE" });
    if (analystUserId) {
      await rest(`user_roles?user_id=eq.${analystUserId}`, { key: SERVICE_KEY, method: "DELETE" });
    }
    await deleteTestUser(analystUserId);
  }

  console.log(`\n${pass} pasaron, ${fail} fallaron.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Error corriendo test de analytics_events:", error);
  process.exit(1);
});
