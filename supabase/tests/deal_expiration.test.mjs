// Verificación reproducible de Fase 6C (backlog 624), contra el proyecto Supabase
// una vez que la migración 20260809090000 haya sido revisada, mergeada y aplicada.
// No corre en CI porque requiere las credenciales locales del proyecto real.
//
//   node supabase/tests/deal_expiration.test.mjs

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

if (!URL_BASE || !ANON_KEY || !SERVICE_KEY) {
  console.error("Faltan variables en apps/web/.env.local — no se puede correr el test.");
  process.exit(1);
}

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
    // Empty body is expected for cleanup requests.
  }
  return { status: response.status, json };
}

async function createAndSignInTestUser(email, password) {
  const created = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  }).then((response) => response.json());

  const signedIn = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((response) => response.json());

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
  let productId;
  let expiredPriceId;
  let activePriceId;
  let importedPriceId;
  let importAdminUserId;

  try {
    const site = await rest("sites?select=id&slug=eq.software-ai", { key: SERVICE_KEY });
    const siteId = site.json?.[0]?.id;
    if (!siteId) throw new Error("No se encontró el site software-ai de setup.");

    const product = await rest("products", {
      key: SERVICE_KEY,
      method: "POST",
      body: { site_id: siteId, slug: `p6c-deal-${stamp}`, name: "P6C Deal Expiry Test", status: "published" },
    });
    productId = product.json?.[0]?.id;
    check("setup: producto published creado", product.status === 201 && Boolean(productId), JSON.stringify(product));
    if (!productId) return;

    const expired = await rest("product_prices", {
      key: SERVICE_KEY,
      method: "POST",
      body: {
        product_id: productId,
        price_type: "sale",
        amount: "99.00",
        currency: "USD",
        source: "https://example.test/expired-sale",
        expires_at: "2020-01-01T00:00:00.000Z",
      },
    });
    expiredPriceId = expired.json?.[0]?.id;
    check("setup: oferta vencida creada", expired.status === 201 && Boolean(expiredPriceId), JSON.stringify(expired));

    const active = await rest("product_prices", {
      key: SERVICE_KEY,
      method: "POST",
      body: {
        product_id: productId,
        price_type: "sale",
        amount: "79.00",
        currency: "USD",
        source: "https://example.test/active-sale",
        expires_at: "2099-01-01T00:00:00.000Z",
      },
    });
    activePriceId = active.json?.[0]?.id;
    check("setup: oferta vigente creada", active.status === 201 && Boolean(activePriceId), JSON.stringify(active));

    const anonPrices = await rest(`product_prices?select=id,amount,expires_at&product_id=eq.${productId}`, { key: ANON_KEY });
    check(
      "anon ve solo la oferta vigente; la vencida queda fuera por RLS",
      anonPrices.status === 200 && anonPrices.json?.length === 1 && Number(anonPrices.json[0].amount) === 79,
      JSON.stringify(anonPrices)
    );

    const invalidExpiry = await rest("product_prices", {
      key: SERVICE_KEY,
      method: "POST",
      body: {
        product_id: productId,
        price_type: "list",
        amount: "120.00",
        currency: "USD",
        source: "https://example.test/invalid-expiry",
        expires_at: "2099-01-01T00:00:00.000Z",
      },
    });
    check("la base rechaza expires_at para un precio que no es sale", invalidExpiry.status >= 400, JSON.stringify(invalidExpiry));

    const missingExpiry = await rest("product_prices", {
      key: SERVICE_KEY,
      method: "POST",
      body: {
        product_id: productId,
        price_type: "sale",
        amount: "70.00",
        currency: "USD",
        source: "https://example.test/missing-expiry",
      },
    });
    check("la base rechaza una oferta sale sin expires_at", missingExpiry.status >= 400, JSON.stringify(missingExpiry));

    const importAdmin = await createAndSignInTestUser(`p6c-import-${stamp}@example.com`, "TestPassword123!");
    importAdminUserId = importAdmin.userId;
    const adminRole = await rest("roles?select=id&name=eq.admin", { key: SERVICE_KEY });
    const adminRoleId = adminRole.json?.[0]?.id;
    const roleAssignment = await rest("user_roles", {
      key: SERVICE_KEY,
      method: "POST",
      body: { user_id: importAdmin.userId, role_id: adminRoleId, site_id: siteId },
    });
    check(
      "setup: admin autenticado para probar import_product_prices",
      Boolean(importAdmin.accessToken) && Boolean(adminRoleId) && roleAssignment.status === 201,
      JSON.stringify({ importAdmin: { userId: importAdmin.userId }, adminRole, roleAssignment })
    );

    const importedDeal = await rest("rpc/import_product_prices", {
      key: importAdmin.accessToken,
      extraHeaders: { apikey: ANON_KEY },
      method: "POST",
      body: {
        rows: [
          {
            product_id: productId,
            price_type: "sale",
            amount: "69.00",
            currency: "USD",
            source: "https://example.test/imported-sale",
            expires_at: "2099-01-01T00:00:00.000Z",
          },
        ],
      },
    });
    importedPriceId = importedDeal.json?.[0]?.price_id;
    check(
      "import_product_prices acepta y conserva expires_at para sale",
      importedDeal.status === 200 && importedDeal.json?.[0]?.status === "accepted" && Boolean(importedPriceId),
      JSON.stringify(importedDeal)
    );

    const importedStored = await rest(`product_prices?select=expires_at&id=eq.${importedPriceId}`, { key: SERVICE_KEY });
    check(
      "import_product_prices persiste el vencimiento de la oferta",
      importedStored.status === 200 && Boolean(importedStored.json?.[0]?.expires_at) && new Date(importedStored.json[0].expires_at).toISOString() === "2099-01-01T00:00:00.000Z",
      JSON.stringify(importedStored)
    );

    const invalidImportedDeal = await rest("rpc/import_product_prices", {
      key: importAdmin.accessToken,
      extraHeaders: { apikey: ANON_KEY },
      method: "POST",
      body: {
        rows: [
          {
            product_id: productId,
            price_type: "sale",
            amount: "68.00",
            currency: "USD",
            source: "https://example.test/imported-missing-expiry",
          },
        ],
      },
    });
    check(
      "import_product_prices rechaza sale sin expires_at",
      invalidImportedDeal.status === 200 && invalidImportedDeal.json?.[0]?.status === "rejected",
      JSON.stringify(invalidImportedDeal)
    );
  } finally {
    if (importedPriceId) await rest(`product_prices?id=eq.${importedPriceId}`, { key: SERVICE_KEY, method: "DELETE" });
    if (expiredPriceId) await rest(`product_prices?id=eq.${expiredPriceId}`, { key: SERVICE_KEY, method: "DELETE" });
    if (activePriceId) await rest(`product_prices?id=eq.${activePriceId}`, { key: SERVICE_KEY, method: "DELETE" });
    if (productId) await rest(`products?id=eq.${productId}`, { key: SERVICE_KEY, method: "DELETE" });
    if (importAdminUserId) await rest(`user_roles?user_id=eq.${importAdminUserId}`, { key: SERVICE_KEY, method: "DELETE" });
    await deleteTestUser(importAdminUserId);
  }

  console.log(`\n${pass} pasaron, ${fail} fallaron.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Error corriendo test de expiración de ofertas:", error);
  process.exit(1);
});
