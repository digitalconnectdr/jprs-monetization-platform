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

  const stamp = Date.now();
  const normalUser = {};
  const adminUser = {};
  let testCategorySlug;

  try {
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

    const anonDraftProducts = await rest("products?select=id&status=eq.draft", { key: ANON_KEY });
    check(
      "anon NO ve products en estado draft (solo published)",
      anonDraftProducts.status === 200 && anonDraftProducts.json.length === 0,
      JSON.stringify(anonDraftProducts)
    );

    // --- usuario normal autenticado (sin roles admin) ---
    Object.assign(normalUser, await signUpAndSignIn(`p2-normal-${stamp}@example.com`, "TestPassword123!"));
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

    // --- admin scoped a una property específica ---
    const softwareSite = await rest("sites?select=id,slug,niche_id&slug=eq.software-ai", { key: SERVICE_KEY });
    const otherSite = await rest("sites?select=id,slug&slug=eq.travel", { key: SERVICE_KEY });
    const softwareSiteId = softwareSite.json?.[0]?.id;
    const otherSiteId = otherSite.json?.[0]?.id;

    // Datos de setup vía service_role — si esto falla (ej. faltan GRANTs a
    // service_role, como pasó la primera vez que se corrió este script contra el
    // proyecto real), abortar con un error claro en vez de dejar que "undefined"
    // se propague silenciosamente a los requests siguientes.
    if (!softwareSiteId || !otherSiteId) {
      throw new Error(
        `No se pudo leer sites de setup vía service_role — softwareSite=${JSON.stringify(softwareSite)} otherSite=${JSON.stringify(otherSite)}`
      );
    }

    Object.assign(adminUser, await signUpAndSignIn(`p2-admin-${stamp}@example.com`, "TestPassword123!"));
    const adminRole = await rest("roles?select=id&name=eq.admin", { key: SERVICE_KEY });
    const superAdminRole = await rest("roles?select=id&name=eq.super_admin", { key: SERVICE_KEY });
    const adminRoleId = adminRole.json?.[0]?.id;
    const superAdminRoleId = superAdminRole.json?.[0]?.id;

    if (!adminRoleId || !superAdminRoleId) {
      throw new Error(
        `No se pudo leer roles de setup vía service_role — adminRole=${JSON.stringify(adminRole)} superAdminRole=${JSON.stringify(superAdminRole)}`
      );
    }

    const roleAssignment = await rest("user_roles", {
      key: SERVICE_KEY,
      method: "POST",
      body: { user_id: adminUser.userId, role_id: adminRoleId, site_id: softwareSiteId },
    });
    check(
      "setup: se pudo asignar el rol admin (scoped) al usuario de prueba vía service_role",
      roleAssignment.status === 201,
      JSON.stringify(roleAssignment)
    );

    // Aislamiento real de user_roles: ahora SÍ existe una fila de otro usuario (admin)
    // que el usuario normal no debería poder ver — a diferencia de antes (F-04),
    // este chequeo corre después de que la fila existe.
    const normalReadOtherRoles = await authRest("user_roles?select=*", {
      key: normalUser.accessToken,
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "usuario normal no ve la fila de user_roles de OTRO usuario (admin) aunque exista",
      normalReadOtherRoles.status === 200 && normalReadOtherRoles.json.length === 0,
      JSON.stringify(normalReadOtherRoles)
    );

    // Auto-escalamiento (F-04): usuario normal intenta auto-asignarse admin.
    const escalationAttempt = await authRest("user_roles", {
      key: normalUser.accessToken,
      method: "POST",
      body: { user_id: normalUser.userId, role_id: adminRoleId, site_id: softwareSiteId },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "usuario normal NO puede auto-asignarse el rol admin",
      escalationAttempt.status === 401 || escalationAttempt.status === 403,
      JSON.stringify(escalationAttempt)
    );

    // Auto-promoción a super_admin (F-04): admin scoped intenta escalar a scope global.
    const adminSelfEscalation = await authRest("user_roles", {
      key: adminUser.accessToken,
      method: "POST",
      body: { user_id: adminUser.userId, role_id: superAdminRoleId, site_id: null },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "admin scoped a un site NO puede auto-promoverse a super_admin",
      adminSelfEscalation.status === 401 || adminSelfEscalation.status === 403,
      JSON.stringify(adminSelfEscalation)
    );

    // site_id=NULL solo válido para super_admin, incluso vía service_role (F-01, trigger enforce_role_scope).
    const nullScopeAdminAttempt = await rest("user_roles", {
      key: SERVICE_KEY,
      method: "POST",
      body: { user_id: adminUser.userId, role_id: adminRoleId, site_id: null },
    });
    check(
      "el trigger rechaza site_id=NULL para un rol que no es super_admin (incluso con service_role)",
      nullScopeAdminAttempt.status >= 400,
      JSON.stringify(nullScopeAdminAttempt)
    );

    testCategorySlug = `test-cat-${stamp}`;
    const adminWriteOwnSite = await authRest("categories", {
      key: adminUser.accessToken,
      method: "POST",
      body: { niche_id: softwareSite.json?.[0]?.niche_id, slug: testCategorySlug, name: "Test Category" },
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

    // F-02: admin scoped a un solo site NO puede eliminar ese site (solo super_admin puede).
    // Nota: sin "Prefer: return=representation" en un DELETE, PostgREST devuelve 204
    // tanto si RLS bloqueó silenciosamente (0 filas afectadas) como si el request en
    // teoría hubiera podido borrar algo — el status code solo no alcanza para probar
    // esto. La verificación real es confirmar contra service_role que el site sigue existiendo.
    await authRest(`sites?id=eq.${softwareSiteId}`, {
      key: adminUser.accessToken,
      method: "DELETE",
      extraHeaders: { apikey: ANON_KEY },
    });
    const siteStillExists = await rest(`sites?select=id&id=eq.${softwareSiteId}`, { key: SERVICE_KEY });
    check(
      "admin scoped a un site NO puede hacer DELETE de ese site — el site sigue existiendo (solo super_admin, F-02)",
      siteStillExists.status === 200 && siteStillExists.json?.length === 1,
      JSON.stringify(siteStillExists)
    );

    // Cross-site: admin de Software/AI no puede escribir products de otro site (Travel).
    const adminWriteOtherSiteProduct = await authRest("products", {
      key: adminUser.accessToken,
      method: "POST",
      body: { site_id: otherSiteId, slug: `hack-product-${stamp}`, name: "hack" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "admin scoped a un site NO puede escribir products de OTRO site",
      adminWriteOtherSiteProduct.status === 401 || adminWriteOtherSiteProduct.status === 403,
      JSON.stringify(adminWriteOtherSiteProduct)
    );

    // --- service_role: bypass total (sanity check) ---
    const serviceReadUserRoles = await rest("user_roles?select=*", { key: SERVICE_KEY });
    check(
      "service_role puede leer user_roles (bypass de RLS, por diseño de Supabase)",
      serviceReadUserRoles.status === 200,
      JSON.stringify(serviceReadUserRoles)
    );
  } finally {
    // Cleanup — corre siempre, incluso si un check/request de arriba lanzó excepción
    // (F-03: sin esto, una falla a mitad de script dejaba usuarios/filas huérfanos en
    // el único proyecto Supabase real, sin preview DB — ver ADR-012).
    if (testCategorySlug) {
      await rest(`categories?slug=eq.${testCategorySlug}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    if (adminUser.userId) {
      await rest(`user_roles?user_id=eq.${adminUser.userId}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const uid of [normalUser.userId, adminUser.userId]) {
      if (uid) {
        await fetch(`${URL_BASE}/auth/v1/admin/users/${uid}`, {
          method: "DELETE",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        }).catch(() => {});
      }
    }
  }

  console.log(`\n${pass} pasaron, ${fail} fallaron.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Error corriendo tests:", err);
  process.exit(1);
});
