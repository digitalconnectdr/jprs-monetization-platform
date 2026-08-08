// Script propio del auditor independiente de Fase 5 (no del Builder), conservado como
// evidencia de la auditoría (docs/audits/P5_AUDIT.md). Los hallazgos F-01/F-02 que este
// script reproducía ya están corregidos (20260808050000_fix_p5_audit_findings.sql) y
// las regresiones equivalentes se agregaron a supabase/tests/monetization_access.test.mjs
// (la suite canónica) — al correr este script hoy, esos checks pasan en vez de fallar,
// a diferencia de cuando el auditor lo escribió. Los checks de concurrencia real
// (carrera en record_affiliate_click, duplicado dentro del mismo array en
// import_revenue_events) no tienen equivalente en la suite canónica todavía.
//
// Script propio del auditor independiente de Fase 5 (no del Builder).
// Verifica empíricamente, contra el proyecto Supabase real, hipótesis de bug que la
// lectura de las migraciones SQL sugiere y que supabase/tests/monetization_access.test.mjs
// (el test del Builder) no cubre:
//
//   1. Oráculo/leak vía site_niche_id (SECURITY DEFINER, GRANT EXECUTE directo a
//      authenticated) — ¿un editor sin ningún rol en el niche "travel" puede aprender
//      el niche_id de un site travel en draft, o si un uuid inventado existe?
//   2. Condición de carrera real (no solo secuencial) en record_affiliate_click con el
//      mismo click_id disparado concurrentemente.
//   3. import_revenue_events con el MISMO event_id duplicado DOS VECES dentro del mismo
//      array (no en llamadas separadas).
//   4. monetization_rules: ¿el CHECK constraint se puede evadir con mayúsculas/espacios
//      distintos en allowed_layers, o con un UPDATE parcial que deje page_type=auth con
//      'ads' ya presente?
//   5. sponsorship_placements: disclosure_label con solo espacios en blanco, y NULL
//      explícito.
//   6. Cross-scope no cubierto por el Builder: sponsorship_placements con ad_slot_id (el
//      Builder solo probó content_item_id), UPDATE (no solo INSERT) de affiliate_links /
//      lead_routes / affiliate_programs.vendor_id hacia un scope ajeno.
//
// Correr: node supabase/tests/p5_auditor_extra.test.mjs

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
  console.error("Faltan variables en apps/web/.env.local");
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
function note(label, detail) {
  console.log(`NOTE  ${label}  ${detail}`);
}

async function rest(pathAndQuery, { key, method = "GET", body, extraHeaders = {} } = {}) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (!headers["Prefer"] && (method === "POST" || method === "PATCH")) headers["Prefer"] = "return=representation";
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
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
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
  console.log(`Auditor extra tests (Fase 5) contra ${URL_BASE}\n`);
  const stamp = Date.now();
  const editorUser = {};
  const outsiderAdmin = {};
  const cleanup = {
    userIds: [],
    vendorIds: [],
    productIds: [],
    contentItemIds: [],
    affiliateProgramIds: [],
    affiliateLinkIds: [],
    adSlotIds: [],
    leadFormIds: [],
    leadRouteIds: [],
    sponsoredCampaignIds: [],
    sponsorshipPlacementIds: [],
    monetizationRuleIds: [],
    revenueEventIds: [],
  };

  try {
    const softwareSite = await rest("sites?select=id,niche_id&slug=eq.software-ai", { key: SERVICE_KEY });
    const travelSite = await rest("sites?select=id,niche_id&slug=eq.travel", { key: SERVICE_KEY });
    const softwareSiteId = softwareSite.json?.[0]?.id;
    const softwareNicheId = softwareSite.json?.[0]?.niche_id;
    const travelSiteId = travelSite.json?.[0]?.id;
    const travelNicheId = travelSite.json?.[0]?.niche_id;
    if (!softwareSiteId || !travelSiteId) throw new Error("setup: no se pudo leer sites");

    const editorRole = await rest("roles?select=id&name=eq.editor", { key: SERVICE_KEY });
    const adminRole = await rest("roles?select=id&name=eq.admin", { key: SERVICE_KEY });
    const superAdminRole = await rest("roles?select=id&name=eq.super_admin", { key: SERVICE_KEY });
    const editorRoleId = editorRole.json?.[0]?.id;
    const adminRoleId = adminRole.json?.[0]?.id;
    const superAdminRoleId = superAdminRole.json?.[0]?.id;

    const vendorSoftware = await rest("vendors", {
      key: SERVICE_KEY, method: "POST",
      body: { niche_id: softwareNicheId, slug: `p5aud-vendor-sw-${stamp}`, name: "P5Aud Vendor SW", status: "published" },
    });
    const vendorTravel = await rest("vendors", {
      key: SERVICE_KEY, method: "POST",
      body: { niche_id: travelNicheId, slug: `p5aud-vendor-tr-${stamp}`, name: "P5Aud Vendor TR", status: "published" },
    });
    const vendorSoftwareId = vendorSoftware.json?.[0]?.id;
    const vendorTravelId = vendorTravel.json?.[0]?.id;
    cleanup.vendorIds.push(vendorSoftwareId, vendorTravelId);

    const productSw = await rest("products", { key: SERVICE_KEY, method: "POST", body: { site_id: softwareSiteId, slug: `p5aud-prod-sw-${stamp}`, name: "P5Aud Prod SW", status: "published" } });
    const productSwId = productSw.json?.[0]?.id;
    cleanup.productIds.push(productSwId);

    const superAdminUser = {};
    Object.assign(editorUser, await signUpAndSignIn(`p5aud-editor-${stamp}@example.com`, "TestPassword123!"));
    Object.assign(outsiderAdmin, await signUpAndSignIn(`p5aud-outsider-${stamp}@example.com`, "TestPassword123!"));
    Object.assign(superAdminUser, await signUpAndSignIn(`p5aud-superadmin-${stamp}@example.com`, "TestPassword123!"));
    cleanup.userIds.push(editorUser.userId, outsiderAdmin.userId, superAdminUser.userId);

    await rest("user_roles", { key: SERVICE_KEY, method: "POST", body: { user_id: editorUser.userId, role_id: editorRoleId, site_id: softwareSiteId } });
    await rest("user_roles", { key: SERVICE_KEY, method: "POST", body: { user_id: outsiderAdmin.userId, role_id: adminRoleId, site_id: travelSiteId } });
    await rest("user_roles", { key: SERVICE_KEY, method: "POST", body: { user_id: superAdminUser.userId, role_id: superAdminRoleId, site_id: null } });

    const H = { apikey: ANON_KEY };

    // ============ 1. site_niche_id como oráculo ============
    // editorUser NO tiene ningún rol en travel, y travelSiteId (según seed de Fase 2)
    // suele estar en draft (no público) — confirmemos primero que el editor NO puede leer
    // la fila de sites de travel directamente (el bug original).
    const editorReadTravelSite = await rest(`sites?select=id,niche_id,status&id=eq.${travelSiteId}`, { key: editorUser.accessToken, extraHeaders: H });
    note("editor lee sites?id=travel (control, esperado 0 filas si travel sigue draft)", JSON.stringify(editorReadTravelSite));

    const oracleCall = await rest("rpc/site_niche_id", {
      key: editorUser.accessToken, method: "POST", body: { p_site_id: travelSiteId }, extraHeaders: H,
    });
    const oracleLeaks = oracleCall.status === 200 && oracleCall.json === travelNicheId;
    check(
      "site_niche_id: HALLAZGO ESPERADO — editor SIN rol en travel puede obtener el niche_id real de travelSite vía rpc directo (oráculo)",
      oracleLeaks,
      JSON.stringify({ oracleCall, expectedNicheId: travelNicheId })
    );

    const oracleNonexistent = await rest("rpc/site_niche_id", {
      key: editorUser.accessToken, method: "POST", body: { p_site_id: "00000000-0000-0000-0000-000000000000" }, extraHeaders: H,
    });
    note("site_niche_id con uuid inexistente (existence oracle secundario)", JSON.stringify(oracleNonexistent));

    const oracleAsAnon = await rest("rpc/site_niche_id", {
      key: ANON_KEY, method: "POST", body: { p_site_id: travelSiteId },
    });
    check(
      "site_niche_id: HALLAZGO ESPERADO — anon (SIN NINGUNA sesión, solo la anon key pública) puede llamarlo y obtener el niche_id real (el GRANT EXECUTE explícito solo lista authenticated/service_role, pero PostgreSQL otorga EXECUTE a PUBLIC por defecto al crear la función y la migración nunca hizo REVOKE)",
      oracleAsAnon.status === 200 && oracleAsAnon.json === travelNicheId,
      JSON.stringify(oracleAsAnon)
    );

    const hasRoleInNicheAsAnon = await rest("rpc/has_role_in_niche", {
      key: ANON_KEY, method: "POST", body: { role_name: "super_admin", p_niche_id: softwareNicheId },
    });
    note("has_role_in_niche también callable por anon (mismo gap de PUBLIC EXECUTE) — impacto acotado porque solo devuelve bool sobre auth.uid() (null para anon)", JSON.stringify(hasRoleInNicheAsAnon));

    // ============ 1b. roe_scores — GRANT de tabla vs RLS real para authenticated (no super_admin) ============
    // DATA_DICTIONARY.md dice "no hay GRANT de tabla en absoluto para anon/authenticated sin
    // rol" pero la migración sí hace `grant select, insert on roe_scores to authenticated`
    // (sin scoping) — confirmemos que RLS igual bloquea la lectura para un editor (no
    // super_admin), es decir que el GRANT amplio es inofensivo en la práctica.
    const editorReadRoeScores = await rest("roe_scores?select=id,monetization_score", { key: editorUser.accessToken, extraHeaders: H });
    check(
      "roe_scores: editor (authenticated, no super_admin) tiene GRANT de tabla SELECT pero RLS lo reduce a 0 filas (documentación es imprecisa pero el control real funciona)",
      editorReadRoeScores.status === 200 && Array.isArray(editorReadRoeScores.json) && editorReadRoeScores.json.length === 0,
      JSON.stringify(editorReadRoeScores)
    );

    // ============ 2. record_affiliate_click — condición de carrera real ============
    const program = await rest("affiliate_programs", { key: editorUser.accessToken, method: "POST", body: { vendor_id: vendorSoftwareId, name: `P5Aud Program ${stamp}`, status: "draft" }, extraHeaders: H });
    const programId = program.json?.[0]?.id;
    cleanup.affiliateProgramIds.push(programId);
    const link = await rest("affiliate_links", { key: editorUser.accessToken, method: "POST", body: { program_id: programId, product_id: productSwId, url: "https://example.com/race", link_type: "direct" }, extraHeaders: H });
    const linkId = link.json?.[0]?.id;
    cleanup.affiliateLinkIds.push(linkId);

    if (linkId) {
      const raceClickId = `p5aud-race-${stamp}`;
      const N = 8;
      const results = await Promise.all(
        Array.from({ length: N }, (_, i) =>
          rest("rpc/record_affiliate_click", { key: ANON_KEY, method: "POST", body: { p_click_id: raceClickId, p_affiliate_link_id: linkId, p_session_id: `race-${i}` } })
        )
      );
      const ids = new Set(results.map((r) => r.json));
      const allOk = results.every((r) => r.status === 200);
      check(`record_affiliate_click: ${N} llamadas CONCURRENTES con el mismo click_id — todas status 200`, allOk, JSON.stringify(results.map((r) => r.status)));
      check(`record_affiliate_click: ${N} llamadas concurrentes devuelven el MISMO id (sin condición de carrera visible al cliente)`, ids.size === 1, JSON.stringify([...ids]));

      const rowCount = await rest(`affiliate_clicks?select=id&click_id=eq.${raceClickId}`, { key: SERVICE_KEY });
      check("record_affiliate_click: tras la carrera, solo existe UNA fila real en affiliate_clicks (no duplicado por la concurrencia)", rowCount.status === 200 && rowCount.json.length === 1, JSON.stringify(rowCount));
    }

    // ============ 3. import_revenue_events — event_id repetido DOS VECES en el MISMO array ============
    const dupEventId = `p5aud-dup-${stamp}`;
    const dupImport = await rest("rpc/import_revenue_events", {
      key: superAdminUser.accessToken, method: "POST", extraHeaders: H,
      body: { rows: [
        { event_id: dupEventId, event_type: "affiliate_commission", site_id: softwareSiteId, amount: "5.00" },
        { event_id: dupEventId, event_type: "affiliate_commission", site_id: softwareSiteId, amount: "5.00" },
      ] },
    });
    const dupRows = Array.isArray(dupImport.json) ? dupImport.json : [];
    check("import_revenue_events: event_id repetido 2x en el MISMO array — fila 1 status=accepted", dupRows[0]?.status === "accepted", JSON.stringify(dupImport));
    check("import_revenue_events: event_id repetido 2x en el MISMO array — fila 2 status=duplicate (no accepted 2 veces)", dupRows[1]?.status === "duplicate", JSON.stringify(dupImport));
    if (dupRows[0]?.event_row_id) cleanup.revenueEventIds.push(dupRows[0].event_row_id);
    const dupCount = await rest(`revenue_events?select=id&event_id=eq.${dupEventId}`, { key: SERVICE_KEY });
    check("import_revenue_events: solo 1 fila real en revenue_events pese a 2 entradas del mismo event_id en el array", dupCount.status === 200 && dupCount.json.length === 1, JSON.stringify(dupCount));

    // ============ 4. monetization_rules — CHECK constraint: mayúsculas/espacios ============
    const capsRule = await rest("monetization_rules", { key: editorUser.accessToken, method: "POST", body: { site_id: softwareSiteId, page_type: "admin", allowed_layers: ["Ads"] }, extraHeaders: H });
    if (capsRule.json?.[0]?.id) cleanup.monetizationRuleIds.push(capsRule.json[0].id);
    check(
      "monetization_rules CHECK: 'Ads' (mayúscula) en page_type=admin — HALLAZGO si esto pasa (201) en vez de ser rechazado; el CHECK es case-sensitive literal",
      capsRule.status >= 400,
      JSON.stringify(capsRule)
    );

    const spaceRule = await rest("monetization_rules", { key: editorUser.accessToken, method: "POST", body: { site_id: softwareSiteId, page_type: "low_value", allowed_layers: [" ads"] }, extraHeaders: H });
    if (spaceRule.json?.[0]?.id) cleanup.monetizationRuleIds.push(spaceRule.json[0].id);
    check(
      "monetization_rules CHECK: ' ads' (espacio inicial) en page_type=low_value — HALLAZGO si esto pasa (201)",
      spaceRule.status >= 400,
      JSON.stringify(spaceRule)
    );

    // UPDATE parcial: crear válido en page_type=review con ads permitido, luego mover a auth.
    const validThenAuth = await rest("monetization_rules", { key: editorUser.accessToken, method: "POST", body: { site_id: softwareSiteId, page_type: "deal", allowed_layers: ["ads"] }, extraHeaders: H });
    const validThenAuthId = validThenAuth.json?.[0]?.id;
    if (validThenAuthId) cleanup.monetizationRuleIds.push(validThenAuthId);
    check("monetization_rules: setup — page_type=deal con ads permitido se crea OK", validThenAuth.status === 201, JSON.stringify(validThenAuth));
    if (validThenAuthId) {
      const escalateToAuth = await rest(`monetization_rules?id=eq.${validThenAuthId}`, { key: editorUser.accessToken, method: "PATCH", body: { page_type: "auth" }, extraHeaders: H });
      check(
        "monetization_rules CHECK: UPDATE que mueve page_type a 'auth' dejando 'ads' ya presente en allowed_layers — debe RECHAZARSE",
        escalateToAuth.status >= 400,
        JSON.stringify(escalateToAuth)
      );
    }

    // ============ 5. sponsorship_placements — disclosure_label edge cases ============
    const campaign = await rest("sponsored_campaigns", { key: outsiderAdmin.accessToken, method: "POST", body: { vendor_id: vendorTravelId, name: `P5Aud Campaign ${stamp}`, status: "draft" }, extraHeaders: H });
    const campaignId = campaign.json?.[0]?.id;
    cleanup.sponsoredCampaignIds.push(campaignId);

    const contentItemTravel = await rest("content_items", { key: outsiderAdmin.accessToken, method: "POST", body: { site_id: travelSiteId, content_type: "review", slug: `p5aud-review-travel-${stamp}`, title: "P5Aud Travel Review", status: "draft" }, extraHeaders: H });
    const contentItemTravelId = contentItemTravel.json?.[0]?.id;
    cleanup.contentItemIds.push(contentItemTravelId);

    if (campaignId && contentItemTravelId) {
      const whitespaceLabel = await rest("sponsorship_placements", { key: outsiderAdmin.accessToken, method: "POST", body: { campaign_id: campaignId, content_item_id: contentItemTravelId, disclosure_label: "   " }, extraHeaders: H });
      check("sponsorship_placements CHECK: disclosure_label = '   ' (solo espacios) — debe RECHAZARSE (trim())", whitespaceLabel.status >= 400, JSON.stringify(whitespaceLabel));

      const nullLabel = await rest("sponsorship_placements", { key: outsiderAdmin.accessToken, method: "POST", body: { campaign_id: campaignId, content_item_id: contentItemTravelId, disclosure_label: null }, extraHeaders: H });
      check("sponsorship_placements: disclosure_label = null EXPLÍCITO — debe RECHAZARSE (NOT NULL, no debe caer al default)", nullLabel.status >= 400, JSON.stringify(nullLabel));
    }

    // ============ 6a. sponsorship_placements con ad_slot_id (camino NO probado por el Builder) ============
    const adSlotTravel = await rest("ad_slots", { key: outsiderAdmin.accessToken, method: "POST", body: { site_id: travelSiteId, slot_key: `p5aud-slot-tr-${stamp}`, page_type: "review", status: "draft" }, extraHeaders: H });
    const adSlotTravelId = adSlotTravel.json?.[0]?.id;
    if (adSlotTravelId) cleanup.adSlotIds.push(adSlotTravelId);
    const adSlotSoftware = await rest("ad_slots", { key: editorUser.accessToken, method: "POST", body: { site_id: softwareSiteId, slot_key: `p5aud-slot-sw-${stamp}`, page_type: "review", status: "draft" }, extraHeaders: H });
    const adSlotSoftwareId = adSlotSoftware.json?.[0]?.id;
    if (adSlotSoftwareId) cleanup.adSlotIds.push(adSlotSoftwareId);

    if (campaignId && adSlotSoftwareId) {
      const crossNicheAdSlotPlacement = await rest("sponsorship_placements", { key: outsiderAdmin.accessToken, method: "POST", body: { campaign_id: campaignId, ad_slot_id: adSlotSoftwareId }, extraHeaders: H });
      check(
        "sponsorship_placements CROSS-NICHE via ad_slot_id: admin de travel NO puede usar un ad_slot de software-ai para su campaña de travel (camino no cubierto por el test del Builder, que solo usó content_item_id)",
        crossNicheAdSlotPlacement.status === 401 || crossNicheAdSlotPlacement.status === 403,
        JSON.stringify(crossNicheAdSlotPlacement)
      );
    }
    if (campaignId && adSlotTravelId) {
      const sameNicheAdSlotPlacement = await rest("sponsorship_placements", { key: outsiderAdmin.accessToken, method: "POST", body: { campaign_id: campaignId, ad_slot_id: adSlotTravelId }, extraHeaders: H });
      check("sponsorship_placements ACEPTA ad_slot_id del mismo niche que la campaña (positivo, camino antes sin probar)", sameNicheAdSlotPlacement.status === 201, JSON.stringify(sameNicheAdSlotPlacement));
      if (sameNicheAdSlotPlacement.json?.[0]?.id) cleanup.sponsorshipPlacementIds.push(sameNicheAdSlotPlacement.json[0].id);
    }

    // ============ 6b. UPDATE (no solo INSERT) hacia scope ajeno ============
    // affiliate_links: crear válido (product_id + content_item_id de software-ai), luego
    // PATCH content_item_id a un content_item de travel (cross-site) — el Builder solo
    // probó el INSERT cross-site, no el UPDATE.
    const contentItemSw = await rest("content_items", { key: editorUser.accessToken, method: "POST", body: { site_id: softwareSiteId, content_type: "review", slug: `p5aud-review-sw-${stamp}`, title: "P5Aud SW Review", status: "draft" }, extraHeaders: H });
    const contentItemSwId = contentItemSw.json?.[0]?.id;
    cleanup.contentItemIds.push(contentItemSwId);

    const validLinkForUpdate = await rest("affiliate_links", { key: editorUser.accessToken, method: "POST", body: { program_id: programId, product_id: productSwId, content_item_id: contentItemSwId, url: "https://example.com/upd", link_type: "direct" }, extraHeaders: H });
    const validLinkForUpdateId = validLinkForUpdate.json?.[0]?.id;
    if (validLinkForUpdateId) cleanup.affiliateLinkIds.push(validLinkForUpdateId);
    if (validLinkForUpdateId && contentItemTravelId) {
      const escalateLink = await rest(`affiliate_links?id=eq.${validLinkForUpdateId}`, { key: editorUser.accessToken, method: "PATCH", body: { content_item_id: contentItemTravelId }, extraHeaders: H });
      check(
        "affiliate_links UPDATE: PATCH content_item_id a un item de OTRO site (travel) sobre un link ya válido de software-ai — debe RECHAZARSE igual que el INSERT",
        escalateLink.status === 401 || escalateLink.status === 403 || (escalateLink.status === 200 && Array.isArray(escalateLink.json) && escalateLink.json.length === 0),
        JSON.stringify(escalateLink)
      );
    }

    // lead_routes: crear válido (software form + software vendor), luego PATCH vendor_id a travel.
    const swForm = await rest("lead_forms", { key: editorUser.accessToken, method: "POST", body: { site_id: softwareSiteId, slug: `p5aud-form-${stamp}`, name: "P5Aud Form", status: "published" }, extraHeaders: H });
    const swFormId = swForm.json?.[0]?.id;
    if (swFormId) cleanup.leadFormIds.push(swFormId);
    const validRoute = await rest("lead_routes", { key: editorUser.accessToken, method: "POST", body: { lead_form_id: swFormId, vendor_id: vendorSoftwareId, routing_rule: {} }, extraHeaders: H });
    const validRouteId = validRoute.json?.[0]?.id;
    if (validRouteId) cleanup.leadRouteIds.push(validRouteId);
    if (validRouteId) {
      const escalateRoute = await rest(`lead_routes?id=eq.${validRouteId}`, { key: editorUser.accessToken, method: "PATCH", body: { vendor_id: vendorTravelId }, extraHeaders: H });
      check(
        "lead_routes UPDATE: PATCH vendor_id a un vendor de OTRO niche (travel) sobre una route ya válida — debe RECHAZARSE igual que el INSERT",
        escalateRoute.status === 401 || escalateRoute.status === 403 || (escalateRoute.status === 200 && Array.isArray(escalateRoute.json) && escalateRoute.json.length === 0),
        JSON.stringify(escalateRoute)
      );
    }

    // affiliate_programs: editor de software-ai intenta secuestrar su propio programa
    // hacia el vendor de travel (fuera de su niche) vía UPDATE de vendor_id.
    if (programId) {
      const hijackProgram = await rest(`affiliate_programs?id=eq.${programId}`, { key: editorUser.accessToken, method: "PATCH", body: { vendor_id: vendorTravelId }, extraHeaders: H });
      check(
        "affiliate_programs UPDATE: editor de software-ai NO puede mover su propio programa a un vendor_id de travel (niche ajeno) vía PATCH",
        hijackProgram.status === 401 || hijackProgram.status === 403 || (hijackProgram.status === 200 && Array.isArray(hijackProgram.json) && hijackProgram.json.length === 0),
        JSON.stringify(hijackProgram)
      );
    }
  } finally {
    for (const id of cleanup.revenueEventIds) await rest(`revenue_events?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    await rest(`revenue_events?event_id=like.p5aud-*`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const id of cleanup.sponsorshipPlacementIds) await rest(`sponsorship_placements?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const id of cleanup.sponsoredCampaignIds) {
      await rest(`sponsorship_placements?campaign_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`sponsored_campaigns?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.monetizationRuleIds) await rest(`monetization_rules?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const id of cleanup.adSlotIds) await rest(`ad_slots?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const id of cleanup.leadRouteIds) await rest(`lead_routes?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const id of cleanup.leadFormIds) {
      await rest(`lead_submissions?lead_form_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`lead_routes?lead_form_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`lead_forms?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.affiliateLinkIds) {
      await rest(`affiliate_clicks?affiliate_link_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`affiliate_links?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.affiliateProgramIds) {
      await rest(`affiliate_offers?program_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`affiliate_terms?program_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`affiliate_programs?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.contentItemIds) await rest(`content_items?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const id of cleanup.productIds) await rest(`products?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const id of cleanup.vendorIds) await rest(`vendors?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const uid of cleanup.userIds) {
      if (!uid) continue;
      await rest(`user_roles?user_id=eq.${uid}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await fetch(`${URL_BASE}/auth/v1/admin/users/${uid}`, { method: "DELETE", headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }).catch(() => {});
    }
  }

  console.log(`\n${pass} pasaron, ${fail} fallaron.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Error corriendo tests:", err);
  process.exit(1);
});
