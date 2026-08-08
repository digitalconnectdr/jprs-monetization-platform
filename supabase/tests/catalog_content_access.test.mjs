// Test de acceso positivo/negativo contra el proyecto Supabase real (Fase 4).
//
// No corre en CI (mismo motivo que rls_access.test.mjs, Fase 2 — sin secrets de
// Supabase en GitHub Actions). Correr manualmente:
//
//   node supabase/tests/catalog_content_access.test.mjs
//
// Verifica los criterios de aceptación de Fase 4 (docs/phases/P4.md):
//   - CRUD de catalog con autorización correcta (editor/admin del site).
//   - product_features/product_prices son append-only (UPDATE bloqueado para todos).
//   - Cross-site: admin de un site no puede escribir catalog/content de otro site.
//   - content_items no puede publicarse sin una content_version approved (trigger).
//   - Lectura pública solo ve la versión live de contenido published.
//   - import_product_prices rechaza filas inválidas sin abortar el lote.
//   - freshness_checks es admin-only.

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
  if (method === "POST" || method === "PATCH") headers["Prefer"] = "return=representation";

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

async function signUpAndSignIn(email, password) {
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
  console.log(`Corriendo tests de RLS de Fase 4 contra ${URL_BASE}\n`);

  const stamp = Date.now();
  const editorUser = {};
  const outsiderAdmin = {};
  const normalUser = {};
  const cleanup = {
    productIds: [],
    contentItemIds: [],
    userIds: [],
  };

  try {
    // --- setup vía service_role ---
    const softwareSite = await rest("sites?select=id,niche_id&slug=eq.software-ai", { key: SERVICE_KEY });
    const travelSite = await rest("sites?select=id&slug=eq.travel", { key: SERVICE_KEY });
    const softwareSiteId = softwareSite.json?.[0]?.id;
    const softwareNicheId = softwareSite.json?.[0]?.niche_id;
    const travelSiteId = travelSite.json?.[0]?.id;
    if (!softwareSiteId || !travelSiteId) {
      throw new Error(`No se pudo leer sites de setup — software=${JSON.stringify(softwareSite)} travel=${JSON.stringify(travelSite)}`);
    }

    const editorRole = await rest("roles?select=id&name=eq.editor", { key: SERVICE_KEY });
    const adminRole = await rest("roles?select=id&name=eq.admin", { key: SERVICE_KEY });
    const editorRoleId = editorRole.json?.[0]?.id;
    const adminRoleId = adminRole.json?.[0]?.id;
    if (!editorRoleId || !adminRoleId) {
      throw new Error(`No se pudo leer roles — editor=${JSON.stringify(editorRole)} admin=${JSON.stringify(adminRole)}`);
    }

    // Producto published (para exercitar lectura pública de variants/features/prices) y
    // uno draft (para confirmar que su catalog hijo NO es público) — ambos en software-ai.
    const publishedProduct = await rest("products", {
      key: SERVICE_KEY,
      method: "POST",
      body: { site_id: softwareSiteId, slug: `p4-pub-${stamp}`, name: "P4 Published Product", status: "published" },
    });
    const draftProduct = await rest("products", {
      key: SERVICE_KEY,
      method: "POST",
      body: { site_id: softwareSiteId, slug: `p4-draft-${stamp}`, name: "P4 Draft Product", status: "draft" },
    });
    const publishedProductId = publishedProduct.json?.[0]?.id;
    const draftProductId = draftProduct.json?.[0]?.id;
    check("setup: producto published creado", publishedProduct.status === 201 && Boolean(publishedProductId), JSON.stringify(publishedProduct));
    check("setup: producto draft creado", draftProduct.status === 201 && Boolean(draftProductId), JSON.stringify(draftProduct));
    if (publishedProductId) cleanup.productIds.push(publishedProductId);
    if (draftProductId) cleanup.productIds.push(draftProductId);

    // Usuario "editor" scoped a software-ai, y un "admin" de OTRO site (travel) para
    // probar aislamiento cross-site.
    Object.assign(editorUser, await signUpAndSignIn(`p4-editor-${stamp}@example.com`, "TestPassword123!"));
    Object.assign(outsiderAdmin, await signUpAndSignIn(`p4-outsider-${stamp}@example.com`, "TestPassword123!"));
    Object.assign(normalUser, await signUpAndSignIn(`p4-normal-${stamp}@example.com`, "TestPassword123!"));
    cleanup.userIds.push(editorUser.userId, outsiderAdmin.userId, normalUser.userId);

    const editorRoleAssign = await rest("user_roles", {
      key: SERVICE_KEY,
      method: "POST",
      body: { user_id: editorUser.userId, role_id: editorRoleId, site_id: softwareSiteId },
    });
    const outsiderRoleAssign = await rest("user_roles", {
      key: SERVICE_KEY,
      method: "POST",
      body: { user_id: outsiderAdmin.userId, role_id: adminRoleId, site_id: travelSiteId },
    });
    check("setup: rol editor asignado (software-ai)", editorRoleAssign.status === 201, JSON.stringify(editorRoleAssign));
    check("setup: rol admin asignado (travel, outsider)", outsiderRoleAssign.status === 201, JSON.stringify(outsiderRoleAssign));

    // --- anon: lectura pública ---
    const anonFeaturesOnDraft = await rest(`product_features?select=id&product_id=eq.${draftProductId}`, { key: ANON_KEY });
    check(
      "anon NO ve product_features de un producto draft",
      anonFeaturesOnDraft.status === 200 && anonFeaturesOnDraft.json.length === 0,
      JSON.stringify(anonFeaturesOnDraft)
    );

    // --- editor scoped puede escribir catalog de su propio site ---
    const editorInsertVariant = await rest("product_variants", {
      key: editorUser.accessToken,
      method: "POST",
      body: { product_id: publishedProductId, slug: "standard", name: "Standard", status: "published" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor scoped puede crear variant de su propio producto", editorInsertVariant.status === 201, JSON.stringify(editorInsertVariant));

    const editorInsertFeature = await rest("product_features", {
      key: editorUser.accessToken,
      method: "POST",
      body: { product_id: publishedProductId, feature_key: "seats", feature_value: "unlimited", source: "vendor pricing page", checked_at: new Date().toISOString() },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor scoped puede insertar product_feature con source/checked_at", editorInsertFeature.status === 201, JSON.stringify(editorInsertFeature));
    const featureId = editorInsertFeature.json?.[0]?.id;

    const editorInsertPrice = await rest("product_prices", {
      key: editorUser.accessToken,
      method: "POST",
      body: { product_id: publishedProductId, price_type: "list", amount: "29.00", currency: "USD", source: "vendor pricing page" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor scoped puede insertar product_price con source", editorInsertPrice.status === 201, JSON.stringify(editorInsertPrice));
    const priceId = editorInsertPrice.json?.[0]?.id;

    // --- append-only: nadie puede UPDATE un precio/feature existente ---
    if (priceId) {
      const editorUpdatePrice = await rest(`product_prices?id=eq.${priceId}`, {
        key: editorUser.accessToken,
        method: "PATCH",
        body: { amount: "1.00" },
        extraHeaders: { apikey: ANON_KEY },
      });
      check(
        "editor NO puede hacer UPDATE de un product_price existente (append-only para roles de aplicación)",
        editorUpdatePrice.status === 404 || editorUpdatePrice.status === 401 || editorUpdatePrice.status === 403 || (Array.isArray(editorUpdatePrice.json) && editorUpdatePrice.json.length === 0),
        JSON.stringify(editorUpdatePrice)
      );

      const priceStillOriginal = await rest(`product_prices?select=amount&id=eq.${priceId}`, { key: SERVICE_KEY });
      check(
        "el monto original (29.00) no cambió tras el intento de UPDATE del editor",
        Number(priceStillOriginal.json?.[0]?.amount) === 29,
        JSON.stringify(priceStillOriginal)
      );
    }
    if (featureId) {
      const editorUpdateFeature = await rest(`product_features?id=eq.${featureId}`, {
        key: editorUser.accessToken,
        method: "PATCH",
        body: { feature_value: "5 seats" },
        extraHeaders: { apikey: ANON_KEY },
      });
      check(
        "editor NO puede hacer UPDATE de un product_feature existente (append-only)",
        editorUpdateFeature.status === 404 || editorUpdateFeature.status === 401 || editorUpdateFeature.status === 403 || (Array.isArray(editorUpdateFeature.json) && editorUpdateFeature.json.length === 0),
        JSON.stringify(editorUpdateFeature)
      );
    }

    // --- cross-site: admin de otro site (travel) NO puede escribir catalog de software-ai ---
    const outsiderInsertPrice = await rest("product_prices", {
      key: outsiderAdmin.accessToken,
      method: "POST",
      body: { product_id: publishedProductId, price_type: "list", amount: "1.00", currency: "USD", source: "hack" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "admin de OTRO site NO puede insertar product_prices de software-ai",
      outsiderInsertPrice.status === 401 || outsiderInsertPrice.status === 403,
      JSON.stringify(outsiderInsertPrice)
    );

    // --- usuario normal (sin roles) no puede escribir catalog en absoluto ---
    const normalInsertPrice = await rest("product_prices", {
      key: normalUser.accessToken,
      method: "POST",
      body: { product_id: publishedProductId, price_type: "list", amount: "1.00", currency: "USD", source: "hack" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("usuario normal NO puede insertar product_prices", normalInsertPrice.status === 401 || normalInsertPrice.status === 403, JSON.stringify(normalInsertPrice));

    // --- content workflow: no se puede publicar sin versión approved (trigger) ---
    const contentItem = await rest("content_items", {
      key: editorUser.accessToken,
      method: "POST",
      body: { site_id: softwareSiteId, content_type: "review", slug: `p4-review-${stamp}`, title: "P4 Test Review", status: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor puede crear content_item en draft", contentItem.status === 201, JSON.stringify(contentItem));
    const contentItemId = contentItem.json?.[0]?.id;
    if (contentItemId) cleanup.contentItemIds.push(contentItemId);

    const draftVersion = await rest("content_versions", {
      key: editorUser.accessToken,
      method: "POST",
      body: { content_item_id: contentItemId, version_number: 1, body: { intro: "borrador" }, review_state: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor puede crear content_version en draft", draftVersion.status === 201, JSON.stringify(draftVersion));
    const draftVersionId = draftVersion.json?.[0]?.id;

    const publishWithoutApproval = await rest(`content_items?id=eq.${contentItemId}`, {
      key: editorUser.accessToken,
      method: "PATCH",
      body: { current_version_id: draftVersionId, status: "published" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "el trigger RECHAZA publicar un content_item cuya versión NO está approved",
      publishWithoutApproval.status >= 400,
      JSON.stringify(publishWithoutApproval)
    );

    const approveVersion = await rest(`content_versions?id=eq.${draftVersionId}`, {
      key: editorUser.accessToken,
      method: "PATCH",
      body: { review_state: "approved" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor puede aprobar su propia versión (sin separación de roles en Fase 4 MVP)", approveVersion.status === 200 || approveVersion.status === 204, JSON.stringify(approveVersion));

    const publishAfterApproval = await rest(`content_items?id=eq.${contentItemId}`, {
      key: editorUser.accessToken,
      method: "PATCH",
      body: { current_version_id: draftVersionId, status: "published" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("el trigger PERMITE publicar una vez que la versión está approved", publishAfterApproval.status === 200 || publishAfterApproval.status === 204, JSON.stringify(publishAfterApproval));

    // --- F-01 (docs/audits/P4_AUDIT.md): hijack de current_version_id entre items ---
    // Un segundo content_item (Z), con su propia versión SIN aprobar, no debe poder
    // "tomar prestada" la versión approved de otro item (contentItemId/draftVersionId)
    // para publicarse — el trigger debe validar que la versión pertenezca al MISMO item.
    const hijackItem = await rest("content_items", {
      key: editorUser.accessToken,
      method: "POST",
      body: { site_id: softwareSiteId, content_type: "review", slug: `p4-hijack-${stamp}`, title: "P4 Hijack Attempt", status: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    const hijackItemId = hijackItem.json?.[0]?.id;
    if (hijackItemId) cleanup.contentItemIds.push(hijackItemId);

    const hijackPublish = await rest(`content_items?id=eq.${hijackItemId}`, {
      key: editorUser.accessToken,
      method: "PATCH",
      body: { current_version_id: draftVersionId, status: "published" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "F-01: el trigger RECHAZA publicar un content_item apuntando a la versión approved de OTRO content_item",
      hijackPublish.status >= 400,
      JSON.stringify(hijackPublish)
    );

    // --- F-02/F-03 (docs/audits/P4_AUDIT.md): content_product_links cross-site ---
    const travelDraftProduct = await rest("products", {
      key: SERVICE_KEY,
      method: "POST",
      body: { site_id: travelSiteId, slug: `p4-travel-draft-${stamp}`, name: "P4 Travel Draft Product", status: "draft" },
    });
    const travelDraftProductId = travelDraftProduct.json?.[0]?.id;
    if (travelDraftProductId) cleanup.productIds.push(travelDraftProductId);

    const crossSiteLink = await rest("content_product_links", {
      key: editorUser.accessToken,
      method: "POST",
      body: { content_item_id: contentItemId, product_id: travelDraftProductId, role: "mentioned" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "F-03: editor de software-ai NO puede vincular un producto de OTRO site (travel) a su contenido",
      crossSiteLink.status === 401 || crossSiteLink.status === 403,
      JSON.stringify(crossSiteLink)
    );

    // F-02: aunque se fuerce el link vía service_role (aislando la policy de LECTURA de
    // la de escritura), un producto draft del mismo site vinculado NO debe filtrarse a anon.
    const forcedDraftLink = await rest("content_product_links", {
      key: SERVICE_KEY,
      method: "POST",
      body: { content_item_id: contentItemId, product_id: draftProductId, role: "mentioned" },
    });
    check("setup F-02: link forzado vía service_role creado", forcedDraftLink.status === 201, JSON.stringify(forcedDraftLink));

    const anonReadDraftLink = await rest(`content_product_links?select=id&content_item_id=eq.${contentItemId}&product_id=eq.${draftProductId}`, { key: ANON_KEY });
    check(
      "F-02: anon NO ve un content_product_link cuyo producto vinculado sigue en draft",
      anonReadDraftLink.status === 200 && anonReadDraftLink.json.length === 0,
      JSON.stringify(anonReadDraftLink)
    );

    // --- lectura pública ve la versión live de contenido published ---
    const anonReadPublishedContent = await rest(`content_items?select=id,status&id=eq.${contentItemId}`, { key: ANON_KEY });
    check(
      "anon SÍ ve el content_item ya published",
      anonReadPublishedContent.status === 200 && anonReadPublishedContent.json.length === 1,
      JSON.stringify(anonReadPublishedContent)
    );

    const anonReadLiveVersion = await rest(`content_versions?select=id&id=eq.${draftVersionId}`, { key: ANON_KEY });
    check(
      "anon SÍ ve la content_version que es la current_version_id de un item published",
      anonReadLiveVersion.status === 200 && anonReadLiveVersion.json.length === 1,
      JSON.stringify(anonReadLiveVersion)
    );

    // --- import_product_prices: lote mixto válido/inválido ---
    const importResult = await rest("rpc/import_product_prices", {
      key: editorUser.accessToken,
      method: "POST",
      body: {
        rows: [
          { product_id: publishedProductId, amount: "49.00", currency: "USD", source: "import test valid" },
          { product_id: publishedProductId, amount: "-5.00", currency: "USD", source: "import test negative" },
          { product_id: "00000000-0000-0000-0000-000000000000", amount: "10.00", currency: "USD", source: "import test missing product" },
          { product_id: publishedProductId, amount: "10.00", currency: "US", source: "import test bad currency" },
        ],
      },
      extraHeaders: { apikey: ANON_KEY },
    });
    const importRows = Array.isArray(importResult.json) ? importResult.json : [];
    check(
      "import_product_prices acepta la fila válida y rechaza las 3 inválidas, sin abortar el lote",
      importResult.status === 200 &&
        importRows.length === 4 &&
        importRows.filter((r) => r.status === "accepted").length === 1 &&
        importRows.filter((r) => r.status === "rejected").length === 3,
      JSON.stringify(importResult)
    );

    const importUnauthorized = await rest("rpc/import_product_prices", {
      key: outsiderAdmin.accessToken,
      method: "POST",
      body: { rows: [{ product_id: publishedProductId, amount: "1.00", currency: "USD", source: "hack" }] },
      extraHeaders: { apikey: ANON_KEY },
    });
    const importUnauthorizedRows = Array.isArray(importUnauthorized.json) ? importUnauthorized.json : [];
    check(
      "import_product_prices rechaza filas de un site donde el llamador no tiene rol (admin de travel intentando software-ai)",
      importUnauthorized.status === 200 && importUnauthorizedRows[0]?.status === "rejected",
      JSON.stringify(importUnauthorized)
    );

    // --- F-04 (docs/audits/P4_AUDIT.md): el mensaje de rechazo ya no distingue entre
    // "producto no existe" y "sin autorización" — un usuario sin ningún rol no puede
    // usarlo como oráculo de existencia de product_id ajenos.
    const oracleTest = await rest("rpc/import_product_prices", {
      key: normalUser.accessToken,
      method: "POST",
      body: {
        rows: [
          { product_id: publishedProductId, amount: "1.00", currency: "USD", source: "oracle test (producto real, sin acceso)" },
          { product_id: "00000000-0000-0000-0000-000000000000", amount: "1.00", currency: "USD", source: "oracle test (producto inexistente)" },
        ],
      },
      extraHeaders: { apikey: ANON_KEY },
    });
    const oracleRows = Array.isArray(oracleTest.json) ? oracleTest.json : [];
    check(
      "F-04: el motivo de rechazo es IDÉNTICO para 'producto existe sin acceso' y 'producto no existe' (ya no es oráculo)",
      oracleTest.status === 200 &&
        oracleRows.length === 2 &&
        oracleRows.every((r) => r.status === "rejected") &&
        oracleRows[0]?.reason === oracleRows[1]?.reason,
      JSON.stringify(oracleTest)
    );

    // --- freshness_checks: admin-only ---
    const anonReadFreshness = await rest("freshness_checks?select=*", { key: ANON_KEY });
    check(
      "anon NO puede leer freshness_checks",
      anonReadFreshness.status === 401 || anonReadFreshness.status === 403 || (anonReadFreshness.status === 200 && anonReadFreshness.json.length === 0),
      JSON.stringify(anonReadFreshness)
    );

    const editorReadFreshness = await rest("freshness_checks?select=*", {
      key: editorUser.accessToken,
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "editor (no super_admin) NO puede leer freshness_checks",
      editorReadFreshness.status === 401 || editorReadFreshness.status === 403 || (editorReadFreshness.status === 200 && editorReadFreshness.json.length === 0),
      JSON.stringify(editorReadFreshness)
    );
  } finally {
    // Cleanup — corre siempre (F-03 de Fase 2: no dejar datos huérfanos en el único
    // proyecto real, sin preview DB — ADR-012).
    for (const id of cleanup.contentItemIds) {
      await rest(`content_items?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.productIds) {
      await rest(`product_prices?product_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`product_features?product_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`products?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const uid of cleanup.userIds) {
      if (!uid) continue;
      await rest(`user_roles?user_id=eq.${uid}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await fetch(`${URL_BASE}/auth/v1/admin/users/${uid}`, {
        method: "DELETE",
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      }).catch(() => {});
    }
  }

  console.log(`\n${pass} pasaron, ${fail} fallaron.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Error corriendo tests:", err);
  process.exit(1);
});
