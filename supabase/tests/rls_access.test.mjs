// Test de acceso positivo/negativo contra el proyecto Supabase real (Fase 2).
//
// No corre en CI todavía — requiere las credenciales reales de apps/web/.env.local,
// y CI no tiene secrets de Supabase configurados (fuera de scope de Fase 2, ver
// docs/DATA_DICTIONARY.md deuda conocida). Correr manualmente:
//
//   node supabase/tests/rls_access.test.mjs
//
// Verifica los criterios de aceptación de Fase 2 (PROJECT_BLUEPRINT.md):
//   - Usuario normal no puede leer/escribir datos admin.
//   - Admin scope funciona por property.
//   - Todas las tablas sensibles tienen RLS explícito.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "..", "apps", "web", ".env.local");

function loadEnv(p) {
  const content = readFileSync(p, "utf8");
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return vars;
}

const env = loadEnv(envPath);
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !ANON_KEY || !SERVICE_KEY) {
  console.error("Faltan variables en apps/web/.env.local — no se puede correr el test.");
  process.exit(1);
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

async function rest(pathAndQuery, { key, method = "GET", body, extraHeaders = {} } = {}) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (method === "POST") headers["Prefer"] = "return=representation";

  const res = await fetch(`${URL_BASE}/rest/v1/${pathAndQuery}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

async function authRest(pathAndQuery, opts) {
  return rest(pathAndQuery, opts);
}

async function signUpAndSignIn(email, password) {
  // service_role crea el usuario ya confirmado (evita depender de email real)
  const created = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  }).then((r) => r.json());

  const signIn = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());

  return { userId: created.id, accessToken: signIn.access_token };
}

async function main() {
  console.log(`Corriendo tests de RLS contra ${URL_BASE}\n`);

  // --- anon: lectura pública permitida ---
  const anonNiches = await rest("niches?select=id,slug", { key: ANON_KEY });
  check(
    "anon puede leer niches activos",
    anonNiches.status === 200 && Array.isArray(anonNiches.json) && anonNiches.json.length === 3,
    JSON.stringify(anonNiches)
  );

  // --- anon: lectura/escritura de datos admin bloqueada ---
  const anonSiteSettings = await rest("site_settings?select=*", { key: ANON_KEY });
  check(
    "anon NO puede leer site_settings",
    anonSiteSettings.status === 401 || anonSiteSettings.status === 403 || (anonSiteSettings.status === 200 && anonSiteSettings.json.length === 0),
    JSON.stringify(anonSiteSettings)
  );

  const anonUserRoles = await rest("user_roles?select=*", { key: ANON_KEY });
  check(
    "anon NO puede leer user_roles",
    anonUserRoles.status === 401 || anonUserRoles.status === 403,
    JSON.stringify(anonUserRoles)
  );

  const anonInsertNiche = await rest("niches", {
    key: ANON_KEY,
    method: "POST",
    body: { slug: "hack-test", name: "hack" },
  });
  check(
    "anon NO puede insertar en niches",
    anonInsertNiche.status === 401 || anonInsertNiche.status === 403,
    JSON.stringify(anonInsertNiche)
  );

  // --- usuario normal autenticado (sin roles admin) ---
  const stamp = Date.now();
  const normalUser = await signUpAndSignIn(`p2-normal-${stamp}@example.com`, "TestPassword123!");
  check("usuario normal se creó y autenticó", Boolean(normalUser.accessToken), JSON.stringify(normalUser));

  const ownProfile = await authRest(`profiles?id=eq.${normalUser.userId}&select=id`, {
    key: normalUser.accessToken,
    extraHeaders: { apikey: ANON_KEY },
  });
  check(
    "usuario normal puede leer su propio profile",
    ownProfile.status === 200 && ownProfile.json.length === 1,
    JSON.stringify(ownProfile)
  );

  const normalInsertNiche = await authRest("niches", {
    key: normalUser.accessToken,
    method: "POST",
    body: { slug: "hack-test-2", name: "hack2" },
    extraHeaders: { apikey: ANON_KEY },
  });
  check(
    "usuario normal NO puede insertar en niches (dato admin)",
    normalInsertNiche.status === 401 || normalInsertNiche.status === 403,
    JSON.stringify(normalInsertNiche)
  );

  const normalReadOtherRoles = await authRest("user_roles?select=*", {
    key: normalUser.accessToken,
    extraHeaders: { apikey: ANON_KEY },
  });
  check(
    "usuario normal solo ve sus propias user_roles (vacío, no tiene ninguna)",
    normalReadOtherRoles.status === 200 && normalReadOtherRoles.json.length === 0,
    JSON.stringify(normalReadOtherRoles)
  );

  // --- admin scoped a una property específica ---
  const softwareSite = await rest("sites?select=id,slug&slug=eq.software-ai", { key: SERVICE_KEY });
  const otherSite = await rest("sites?select=id,slug&slug=eq.travel", { key: SERVICE_KEY });
  const softwareSiteId = softwareSite.json?.[0]?.id;
  const otherSiteId = otherSite.json?.[0]?.id;

  const adminUser = await signUpAndSignIn(`p2-admin-${stamp}@example.com`, "TestPassword123!");
  const adminRole = await rest("roles?select=id&name=eq.admin", { key: SERVICE_KEY });
  const adminRoleId = adminRole.json?.[0]?.id;

  await rest("user_roles", {
    key: SERVICE_KEY,
    method: "POST",
    body: { user_id: adminUser.userId, role_id: adminRoleId, site_id: softwareSiteId },
  });

  const adminWriteOwnSite = await authRest("categories", {
    key: adminUser.accessToken,
    method: "POST",
    body: { niche_id: softwareSite.json?.[0]?.niche_id, slug: `test-cat-${stamp}`, name: "Test Category" },
    extraHeaders: { apikey: ANON_KEY },
  });
  check(
    "admin scoped puede escribir en su propia property (categories de su niche)",
    adminWriteOwnSite.status === 201,
    JSON.stringify(adminWriteOwnSite)
  );

  const adminWriteOtherSiteSettings = await authRest("site_settings", {
    key: adminUser.accessToken,
    method: "POST",
    body: { site_id: otherSiteId, key: "hack", value: {} },
    extraHeaders: { apikey: ANON_KEY },
  });
  check(
    "admin scoped a un site NO puede escribir site_settings de OTRO site (scope por property)",
    adminWriteOtherSiteSettings.status === 401 || adminWriteOtherSiteSettings.status === 403,
    JSON.stringify(adminWriteOtherSiteSettings)
  );

  // --- service_role: bypass total (sanity check) ---
  const serviceReadUserRoles = await rest("user_roles?select=*", { key: SERVICE_KEY });
  check(
    "service_role puede leer user_roles (bypass de RLS, por diseño de Supabase)",
    serviceReadUserRoles.status === 200,
    JSON.stringify(serviceReadUserRoles)
  );

  // --- cleanup ---
  if (adminWriteOwnSite.status === 201) {
    await rest(`categories?slug=eq.test-cat-${stamp}`, { key: SERVICE_KEY, method: "DELETE" });
  }
  await rest(`user_roles?user_id=eq.${adminUser.userId}`, { key: SERVICE_KEY, method: "DELETE" });
  for (const uid of [normalUser.userId, adminUser.userId]) {
    if (uid) {
      await fetch(`${URL_BASE}/auth/v1/admin/users/${uid}`, {
        method: "DELETE",
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      });
    }
  }

  console.log(`\n${pass} pasaron, ${fail} fallaron.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Error corriendo tests:", err);
  process.exit(1);
});
