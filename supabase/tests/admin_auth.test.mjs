// Backlog 409/706: verifica el mecanismo de auth admin contra el proyecto real, sin
// jamás loguear manualmente vía UI con credenciales reales. Usa cuentas de prueba
// descartables (mismo patrón que deal_expiration.test.mjs/analytics_events.test.mjs),
// creadas y borradas dentro del propio test.
//
//   node supabase/tests/admin_auth.test.mjs

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
  } catch {}
  return { status: response.status, json };
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
  const email = `p409-test-${stamp}@example.com`;
  const tempPassword = `TestPassword123!${stamp}`;
  let userId;
  let siteId;

  try {
    // 1. Provisión vía Admin API (mismo mecanismo que create_super_admin.mjs) —
    //    nunca self-signup.
    const createRes = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: tempPassword, email_confirm: true }),
    });
    const created = await createRes.json();
    userId = created.id;
    check("setup: usuario de prueba creado vía Admin API", createRes.status === 200 && Boolean(userId), JSON.stringify(created));

    const site = await rest("sites?select=id&slug=eq.software-ai", { key: SERVICE_KEY });
    siteId = site.json?.[0]?.id;

    // 2. Sin ningún rol asignado todavía: login funciona (cuenta válida), pero no
    //    puede leer revenue_events (RLS: super_admin únicamente).
    const signIn1 = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: tempPassword }),
    });
    const session1 = await signIn1.json();
    check("login funciona para una cuenta provisionada vía Admin API", signIn1.status === 200 && Boolean(session1.access_token), JSON.stringify(session1));

    const revenueNoRole = await rest("revenue_events?select=id&limit=1", { key: session1.access_token, extraHeaders: { apikey: ANON_KEY } });
    check(
      "sin rol asignado, no puede leer revenue_events (RLS super_admin-only)",
      revenueNoRole.status === 401 || revenueNoRole.status === 403 || (revenueNoRole.status === 200 && revenueNoRole.json?.length === 0),
      JSON.stringify(revenueNoRole)
    );

    // 3. Asignar super_admin (mismo flujo que create_super_admin.mjs) y confirmar
    //    que AHORA sí puede leer revenue_events con su propia sesión (no service_role).
    const roleRes = await rest("roles?select=id&name=eq.super_admin", { key: SERVICE_KEY });
    const roleId = roleRes.json?.[0]?.id;
    const assign = await rest("user_roles", { key: SERVICE_KEY, method: "POST", body: { user_id: userId, role_id: roleId, site_id: null } });
    check("setup: rol super_admin asignado", assign.status === 201, JSON.stringify(assign));

    const revenueAsSuperAdmin = await rest("revenue_events?select=id&limit=1", { key: session1.access_token, extraHeaders: { apikey: ANON_KEY } });
    check(
      "con super_admin, el propio token de sesión (no service_role) puede leer revenue_events",
      revenueAsSuperAdmin.status === 200,
      JSON.stringify(revenueAsSuperAdmin)
    );

    const ownRoles = await rest(`user_roles?select=site_id,role:roles(name)&user_id=eq.${userId}`, { key: session1.access_token, extraHeaders: { apikey: ANON_KEY } });
    check(
      "user_roles_self_read: la sesión puede leer sus propios roles (usado por getAdminContext)",
      ownRoles.status === 200 && ownRoles.json?.[0]?.role?.name === "super_admin",
      JSON.stringify(ownRoles)
    );

    // 4. Flujo de recovery link -> nueva contraseña, igual al que usará el
    //    propietario funcional (nunca revela una contraseña elegida por el agente:
    //    acá se verifica el MECANISMO con una contraseña de prueba descartable).
    const linkRes = await fetch(
      `${URL_BASE}/auth/v1/admin/generate_link?redirect_to=${encodeURIComponent("https://jprs-monetization-platform-web.vercel.app/admin/reset-password")}`,
      {
        method: "POST",
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "recovery", email }),
      }
    );
    const link = await linkRes.json();
    check("generate_link produce un action_link con el redirect_to correcto", linkRes.status === 200 && link.action_link?.includes("/admin/reset-password"), JSON.stringify(link));

    const verifyRes = await fetch(link.action_link, { redirect: "manual" });
    const locationHeader = verifyRes.headers.get("location") ?? "";
    check(
      "el link de recovery redirige con un token de sesión hacia reset-password",
      (verifyRes.status === 302 || verifyRes.status === 303) && locationHeader.includes("/admin/reset-password") && locationHeader.includes("access_token"),
      `status=${verifyRes.status} location=${locationHeader.slice(0, 120)}`
    );

    const hashParams = new URLSearchParams(locationHeader.split("#")[1] ?? "");
    const recoveryAccessToken = hashParams.get("access_token");
    if (recoveryAccessToken) {
      const newPassword = `NewTestPassword456!${stamp}`;
      const updateRes = await fetch(`${URL_BASE}/auth/v1/user`, {
        method: "PUT",
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${recoveryAccessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      check("updateUser({password}) con el token del link de recovery funciona", updateRes.status === 200, JSON.stringify(await updateRes.json()));

      const signInWithNew = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword }),
      });
      check("login funciona con la nueva contraseña establecida vía el link", signInWithNew.status === 200, JSON.stringify(await signInWithNew.json()));
    } else {
      fail++;
      console.log("FAIL  no se pudo extraer access_token del redirect — se omiten los checks de updateUser/nuevo login");
    }
  } finally {
    if (userId) {
      await rest(`user_roles?user_id=eq.${userId}`, { key: SERVICE_KEY, method: "DELETE" });
    }
    await deleteTestUser(userId);
  }

  console.log(`\n${pass} pasaron, ${fail} fallaron.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Error corriendo test de admin auth:", error);
  process.exit(1);
});
