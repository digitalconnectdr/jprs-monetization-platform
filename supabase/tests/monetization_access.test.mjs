// Test de acceso positivo/negativo contra el proyecto Supabase real (Fase 5).
//
// No corre en CI (mismo motivo que las suites de Fase 2/4 — sin secrets de Supabase en
// GitHub Actions). Correr manualmente:
//
//   node supabase/tests/monetization_access.test.mjs
//
// Verifica los criterios de aceptación de Fase 5 (docs/phases/P5.md,
// MONETIZATION_POLICY.md §9):
//   - Clics no se duplican (idempotencia por click_id).
//   - monetization_rules impide ads en page types prohibidos (CHECK constraint).
//   - Revenue reconcilia con import de prueba, idempotente por event_id.
//   - sponsorship_placements nunca puede tener disclosure_label vacío.
//   - Programa de afiliados no puede activarse sin affiliate_terms.
//   - Aislamiento cross-site/cross-niche en cada relación entre entidades de scope
//     distinto (lección de docs/audits/P4_AUDIT.md F-02/F-03).
//   - roe_scores y datos financieros/PII nunca son de lectura pública.

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
  console.log(`Corriendo tests de RLS de Fase 5 contra ${URL_BASE}\n`);

  const stamp = Date.now();
  const editorUser = {};
  const outsiderAdmin = {};
  const superAdminUser = {};
  const cleanup = {
    userIds: [],
    productIds: [],
    contentItemIds: [],
    vendorIds: [],
    affiliateProgramIds: [],
    affiliateLinkIds: [],
    leadFormIds: [],
    sponsoredCampaignIds: [],
    revenueEventIds: [],
  };

  try {
    // --- setup ---
    const softwareSite = await rest("sites?select=id,niche_id&slug=eq.software-ai", { key: SERVICE_KEY });
    const travelSite = await rest("sites?select=id,niche_id&slug=eq.travel", { key: SERVICE_KEY });
    const softwareSiteId = softwareSite.json?.[0]?.id;
    const softwareNicheId = softwareSite.json?.[0]?.niche_id;
    const travelSiteId = travelSite.json?.[0]?.id;
    const travelNicheId = travelSite.json?.[0]?.niche_id;
    if (!softwareSiteId || !travelSiteId) throw new Error(`No se pudo leer sites de setup — ${JSON.stringify({ softwareSite, travelSite })}`);

    const editorRole = await rest("roles?select=id&name=eq.editor", { key: SERVICE_KEY });
    const adminRole = await rest("roles?select=id&name=eq.admin", { key: SERVICE_KEY });
    const superAdminRole = await rest("roles?select=id&name=eq.super_admin", { key: SERVICE_KEY });
    const editorRoleId = editorRole.json?.[0]?.id;
    const adminRoleId = adminRole.json?.[0]?.id;
    const superAdminRoleId = superAdminRole.json?.[0]?.id;

    const vendorSoftware = await rest("vendors", {
      key: SERVICE_KEY,
      method: "POST",
      body: { niche_id: softwareNicheId, slug: `p5-vendor-sw-${stamp}`, name: "P5 Software Vendor", status: "published" },
    });
    const vendorTravel = await rest("vendors", {
      key: SERVICE_KEY,
      method: "POST",
      body: { niche_id: travelNicheId, slug: `p5-vendor-tr-${stamp}`, name: "P5 Travel Vendor", status: "published" },
    });
    const vendorSoftwareId = vendorSoftware.json?.[0]?.id;
    const vendorTravelId = vendorTravel.json?.[0]?.id;
    check("setup: vendor software creado", vendorSoftware.status === 201, JSON.stringify(vendorSoftware));
    check("setup: vendor travel creado", vendorTravel.status === 201, JSON.stringify(vendorTravel));
    if (vendorSoftwareId) cleanup.vendorIds.push(vendorSoftwareId);
    if (vendorTravelId) cleanup.vendorIds.push(vendorTravelId);

    const productSw = await rest("products", {
      key: SERVICE_KEY,
      method: "POST",
      body: { site_id: softwareSiteId, slug: `p5-product-sw-${stamp}`, name: "P5 Software Product", status: "published" },
    });
    const productTravelDraft = await rest("products", {
      key: SERVICE_KEY,
      method: "POST",
      body: { site_id: travelSiteId, slug: `p5-product-tr-${stamp}`, name: "P5 Travel Product", status: "draft" },
    });
    const productSwId = productSw.json?.[0]?.id;
    const productTravelId = productTravelDraft.json?.[0]?.id;
    if (productSwId) cleanup.productIds.push(productSwId);
    if (productTravelId) cleanup.productIds.push(productTravelId);

    Object.assign(editorUser, await signUpAndSignIn(`p5-editor-${stamp}@example.com`, "TestPassword123!"));
    Object.assign(outsiderAdmin, await signUpAndSignIn(`p5-outsider-${stamp}@example.com`, "TestPassword123!"));
    Object.assign(superAdminUser, await signUpAndSignIn(`p5-superadmin-${stamp}@example.com`, "TestPassword123!"));
    cleanup.userIds.push(editorUser.userId, outsiderAdmin.userId, superAdminUser.userId);

    const editorAssign = await rest("user_roles", { key: SERVICE_KEY, method: "POST", body: { user_id: editorUser.userId, role_id: editorRoleId, site_id: softwareSiteId } });
    check("setup: rol editor asignado (software-ai)", editorAssign.status === 201, JSON.stringify(editorAssign));
    const outsiderAssign = await rest("user_roles", { key: SERVICE_KEY, method: "POST", body: { user_id: outsiderAdmin.userId, role_id: adminRoleId, site_id: travelSiteId } });
    check("setup: rol admin asignado (travel, outsider)", outsiderAssign.status === 201, JSON.stringify(outsiderAssign));
    const superAdminAssign = await rest("user_roles", { key: SERVICE_KEY, method: "POST", body: { user_id: superAdminUser.userId, role_id: superAdminRoleId, site_id: null } });
    check("setup: super_admin de prueba asignado", superAdminAssign.status === 201, JSON.stringify(superAdminAssign));

    // Content item published en software-ai (para affiliate_links / sponsorship_placements).
    const contentItem = await rest("content_items", {
      key: editorUser.accessToken,
      method: "POST",
      body: { site_id: softwareSiteId, content_type: "review", slug: `p5-review-${stamp}`, title: "P5 Test Review", status: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    const contentItemId = contentItem.json?.[0]?.id;
    if (contentItemId) cleanup.contentItemIds.push(contentItemId);
    const version = await rest("content_versions", {
      key: editorUser.accessToken,
      method: "POST",
      body: { content_item_id: contentItemId, version_number: 1, body: {}, review_state: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    const versionId = version.json?.[0]?.id;
    await rest(`content_versions?id=eq.${versionId}`, { key: editorUser.accessToken, method: "PATCH", body: { review_state: "approved" }, extraHeaders: { apikey: ANON_KEY } });
    await rest(`content_items?id=eq.${contentItemId}`, { key: editorUser.accessToken, method: "PATCH", body: { current_version_id: versionId, status: "published" }, extraHeaders: { apikey: ANON_KEY } });

    const contentItemTravel = await rest("content_items", {
      key: outsiderAdmin.accessToken,
      method: "POST",
      body: { site_id: travelSiteId, content_type: "review", slug: `p5-review-travel-${stamp}`, title: "P5 Travel Review", status: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    const contentItemTravelId = contentItemTravel.json?.[0]?.id;
    if (contentItemTravelId) cleanup.contentItemIds.push(contentItemTravelId);

    // ================= AFFILIATE =================
    const programInsert = await rest("affiliate_programs", {
      key: editorUser.accessToken,
      method: "POST",
      body: { vendor_id: vendorSoftwareId, name: `P5 Program ${stamp}`, network: "direct", status: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor puede crear affiliate_program para un vendor de su niche", programInsert.status === 201, JSON.stringify(programInsert));
    const programId = programInsert.json?.[0]?.id;
    if (programId) cleanup.affiliateProgramIds.push(programId);

    const outsiderProgramAttempt = await rest("affiliate_programs", {
      key: outsiderAdmin.accessToken,
      method: "POST",
      body: { vendor_id: vendorSoftwareId, name: `P5 Hack Program ${stamp}`, status: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "admin de OTRO niche (travel) NO puede crear affiliate_program para un vendor de software-ai",
      outsiderProgramAttempt.status === 401 || outsiderProgramAttempt.status === 403,
      JSON.stringify(outsiderProgramAttempt)
    );

    const activateWithoutTerms = await rest(`affiliate_programs?id=eq.${programId}`, {
      key: editorUser.accessToken,
      method: "PATCH",
      body: { status: "active" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "el trigger RECHAZA activar un programa sin affiliate_terms registrado",
      activateWithoutTerms.status >= 400,
      JSON.stringify(activateWithoutTerms)
    );

    const termsInsert = await rest("affiliate_terms", {
      key: editorUser.accessToken,
      method: "POST",
      body: { program_id: programId, link_format: "https://vendor.example/?ref={id}", source: "vendor portal" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor puede insertar affiliate_terms", termsInsert.status === 201, JSON.stringify(termsInsert));
    const termsId = termsInsert.json?.[0]?.id;

    const activateWithTerms = await rest(`affiliate_programs?id=eq.${programId}`, {
      key: editorUser.accessToken,
      method: "PATCH",
      body: { status: "active" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("el trigger PERMITE activar un programa con al menos un affiliate_terms", activateWithTerms.status === 200 || activateWithTerms.status === 204, JSON.stringify(activateWithTerms));

    if (termsId) {
      const updateTermsAttempt = await rest(`affiliate_terms?id=eq.${termsId}`, {
        key: editorUser.accessToken,
        method: "PATCH",
        body: { link_format: "hacked" },
        extraHeaders: { apikey: ANON_KEY },
      });
      check(
        "editor NO puede hacer UPDATE de un affiliate_terms existente (append-only)",
        updateTermsAttempt.status === 403 || updateTermsAttempt.status === 404 || (Array.isArray(updateTermsAttempt.json) && updateTermsAttempt.json.length === 0),
        JSON.stringify(updateTermsAttempt)
      );
    }

    const crossNicheOffer = await rest("affiliate_offers", {
      key: editorUser.accessToken,
      method: "POST",
      body: { program_id: programId, product_id: productTravelId, commission_type: "percent", commission_value: "10", source: "test" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "affiliate_offers RECHAZA un product_id de un niche distinto al del vendor del programa",
      crossNicheOffer.status === 401 || crossNicheOffer.status === 403,
      JSON.stringify(crossNicheOffer)
    );

    const sameNicheOffer = await rest("affiliate_offers", {
      key: editorUser.accessToken,
      method: "POST",
      body: { program_id: programId, product_id: productSwId, commission_type: "percent", commission_value: "15", source: "test" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("affiliate_offers ACEPTA un product_id del mismo niche que el vendor del programa", sameNicheOffer.status === 201, JSON.stringify(sameNicheOffer));

    const crossSiteLink = await rest("affiliate_links", {
      key: editorUser.accessToken,
      method: "POST",
      body: { program_id: programId, product_id: productSwId, content_item_id: contentItemTravelId, url: "https://example.com/x", link_type: "direct" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "affiliate_links RECHAZA product_id y content_item_id de sites distintos",
      crossSiteLink.status === 401 || crossSiteLink.status === 403,
      JSON.stringify(crossSiteLink)
    );

    const validLink = await rest("affiliate_links", {
      key: editorUser.accessToken,
      method: "POST",
      body: { program_id: programId, product_id: productSwId, content_item_id: contentItemId, url: "https://example.com/x", link_type: "direct" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("affiliate_links ACEPTA product_id y content_item_id del mismo site", validLink.status === 201, JSON.stringify(validLink));
    const linkId = validLink.json?.[0]?.id;
    if (linkId) cleanup.affiliateLinkIds.push(linkId);

    if (linkId) {
      const clickId = `p5-click-${stamp}`;
      const firstClick = await rest("rpc/record_affiliate_click", {
        key: ANON_KEY,
        method: "POST",
        body: { p_click_id: clickId, p_affiliate_link_id: linkId, p_session_id: "s1" },
      });
      const secondClick = await rest("rpc/record_affiliate_click", {
        key: ANON_KEY,
        method: "POST",
        body: { p_click_id: clickId, p_affiliate_link_id: linkId, p_session_id: "s2" },
      });
      check("record_affiliate_click funciona para anon", firstClick.status === 200, JSON.stringify(firstClick));
      check(
        "record_affiliate_click es idempotente por click_id (misma id devuelta)",
        secondClick.status === 200 && secondClick.json === firstClick.json,
        JSON.stringify({ firstClick, secondClick })
      );

      const clickCount = await rest(`affiliate_clicks?select=id&click_id=eq.${clickId}`, { key: SERVICE_KEY });
      check("solo existe UNA fila en affiliate_clicks para ese click_id (sin duplicar)", clickCount.status === 200 && clickCount.json.length === 1, JSON.stringify(clickCount));

      const editorReadClicks = await rest("affiliate_clicks?select=id", { key: editorUser.accessToken, extraHeaders: { apikey: ANON_KEY } });
      check(
        "editor (no super_admin) NO puede leer affiliate_clicks",
        editorReadClicks.status === 401 || editorReadClicks.status === 403 || (editorReadClicks.status === 200 && editorReadClicks.json.length === 0),
        JSON.stringify(editorReadClicks)
      );
    }

    // ================= MONETIZATION =================
    const prohibitedAdsRule = await rest("monetization_rules", {
      key: editorUser.accessToken,
      method: "POST",
      body: { site_id: softwareSiteId, page_type: "auth", allowed_layers: ["ads"] },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "el CHECK constraint RECHAZA ads en page_type=auth",
      prohibitedAdsRule.status >= 400,
      JSON.stringify(prohibitedAdsRule)
    );

    const validRule = await rest("monetization_rules", {
      key: editorUser.accessToken,
      method: "POST",
      body: { site_id: softwareSiteId, page_type: "review", allowed_layers: ["affiliate"] },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("monetization_rules ACEPTA affiliate en page_type=review", validRule.status === 201, JSON.stringify(validRule));

    const editorRoeInsert = await rest("roe_scores", {
      key: editorUser.accessToken,
      method: "POST",
      body: { content_item_id: contentItemId, rule_version: "v1", ad_ev: "1", affiliate_ev: "1", lead_ev: "0", sponsor_ev: "0" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor (no super_admin) NO puede insertar roe_scores", editorRoeInsert.status === 401 || editorRoeInsert.status === 403, JSON.stringify(editorRoeInsert));

    const superAdminRoeInsert = await rest("roe_scores", {
      key: superAdminUser.accessToken,
      method: "POST",
      body: { content_item_id: contentItemId, rule_version: "v1", ad_ev: "1", affiliate_ev: "1", lead_ev: "0", sponsor_ev: "0" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("super_admin SÍ puede insertar roe_scores", superAdminRoeInsert.status === 201, JSON.stringify(superAdminRoeInsert));

    const anonRoeRead = await rest(`roe_scores?select=id&content_item_id=eq.${contentItemId}`, { key: ANON_KEY });
    check(
      "anon NUNCA puede leer roe_scores",
      anonRoeRead.status === 401 || anonRoeRead.status === 403 || (anonRoeRead.status === 200 && anonRoeRead.json.length === 0),
      JSON.stringify(anonRoeRead)
    );

    // sponsorship_placements: disclosure_label vacío y "ambos/ningún target" deben fallar.
    const campaignInsert = await rest("sponsored_campaigns", {
      key: outsiderAdmin.accessToken,
      method: "POST",
      body: { vendor_id: vendorTravelId, name: `P5 Campaign ${stamp}`, status: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("admin (travel) puede crear sponsored_campaign para vendor de su niche", campaignInsert.status === 201, JSON.stringify(campaignInsert));
    const campaignId = campaignInsert.json?.[0]?.id;
    if (campaignId) cleanup.sponsoredCampaignIds.push(campaignId);

    const editorCampaignAttempt = await rest("sponsored_campaigns", {
      key: editorUser.accessToken,
      method: "POST",
      body: { vendor_id: vendorSoftwareId, name: `P5 Editor Campaign ${stamp}`, status: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    check(
      "editor (no admin) NO puede crear sponsored_campaigns — decisión comercial, admin-only",
      editorCampaignAttempt.status === 401 || editorCampaignAttempt.status === 403,
      JSON.stringify(editorCampaignAttempt)
    );

    if (campaignId && contentItemTravelId) {
      const blankLabel = await rest("sponsorship_placements", {
        key: outsiderAdmin.accessToken,
        method: "POST",
        body: { campaign_id: campaignId, content_item_id: contentItemTravelId, disclosure_label: "" },
        extraHeaders: { apikey: ANON_KEY },
      });
      check("el CHECK constraint RECHAZA disclosure_label vacío", blankLabel.status >= 400, JSON.stringify(blankLabel));

      const noTarget = await rest("sponsorship_placements", {
        key: outsiderAdmin.accessToken,
        method: "POST",
        body: { campaign_id: campaignId },
        extraHeaders: { apikey: ANON_KEY },
      });
      check("el CHECK constraint RECHAZA un placement sin ad_slot_id NI content_item_id", noTarget.status >= 400, JSON.stringify(noTarget));

      const validPlacement = await rest("sponsorship_placements", {
        key: outsiderAdmin.accessToken,
        method: "POST",
        body: { campaign_id: campaignId, content_item_id: contentItemTravelId },
        extraHeaders: { apikey: ANON_KEY },
      });
      check("sponsorship_placements ACEPTA un placement válido con disclosure_label default 'Sponsored'", validPlacement.status === 201 && validPlacement.json?.[0]?.disclosure_label === "Sponsored", JSON.stringify(validPlacement));
    }

    // ================= LEADS =================
    const draftForm = await rest("lead_forms", {
      key: editorUser.accessToken,
      method: "POST",
      body: { site_id: softwareSiteId, slug: `p5-form-draft-${stamp}`, name: "P5 Draft Form", status: "draft" },
      extraHeaders: { apikey: ANON_KEY },
    });
    const draftFormId = draftForm.json?.[0]?.id;
    if (draftFormId) cleanup.leadFormIds.push(draftFormId);

    const anonReadDraftForm = await rest(`lead_forms?select=id&id=eq.${draftFormId}`, { key: ANON_KEY });
    check("anon NO ve un lead_form en draft", anonReadDraftForm.status === 200 && anonReadDraftForm.json.length === 0, JSON.stringify(anonReadDraftForm));

    const publishedForm = await rest("lead_forms", {
      key: editorUser.accessToken,
      method: "POST",
      body: { site_id: softwareSiteId, slug: `p5-form-pub-${stamp}`, name: "P5 Published Form", status: "published", fields: [{ key: "email", type: "email" }] },
      extraHeaders: { apikey: ANON_KEY },
    });
    const publishedFormId = publishedForm.json?.[0]?.id;
    if (publishedFormId) cleanup.leadFormIds.push(publishedFormId);

    const anonReadPublishedForm = await rest(`lead_forms?select=id&id=eq.${publishedFormId}`, { key: ANON_KEY });
    check("anon SÍ ve un lead_form published (necesita verlo para llenarlo)", anonReadPublishedForm.status === 200 && anonReadPublishedForm.json.length === 1, JSON.stringify(anonReadPublishedForm));

    // anon no tiene SELECT sobre lead_submissions (PII, insert-only) — con
    // Prefer:return=representation (default de nuestro helper) PostgREST necesitaría
    // leer la fila para devolverla, lo cual falla por falta de GRANT SELECT. Un
    // cliente público real pediría return=minimal (solo confirma 201, sin leer PII de
    // vuelta) — es exactamente el patrón correcto para un insert write-only.
    const submission = await rest("lead_submissions", {
      key: ANON_KEY,
      method: "POST",
      body: { lead_form_id: publishedFormId, submitted_data: { email: `lead-${stamp}@example.com` } },
      extraHeaders: { Prefer: "return=minimal" },
    });
    check("anon puede ENVIAR un lead a un form published", submission.status === 201, JSON.stringify(submission));

    const submissionLookup = await rest(`lead_submissions?select=id&lead_form_id=eq.${publishedFormId}`, { key: SERVICE_KEY });
    const submissionId = submissionLookup.json?.[0]?.id;

    const anonReadSubmissions = await rest(`lead_submissions?select=id&id=eq.${submissionId}`, { key: ANON_KEY });
    check(
      "anon NO puede LEER lead_submissions (PII, insert-only)",
      anonReadSubmissions.status === 401 || anonReadSubmissions.status === 403 || (anonReadSubmissions.status === 200 && anonReadSubmissions.json.length === 0),
      JSON.stringify(anonReadSubmissions)
    );

    const editorReadSubmissions = await rest(`lead_submissions?select=id&id=eq.${submissionId}`, { key: editorUser.accessToken, extraHeaders: { apikey: ANON_KEY } });
    check(
      "editor (no super_admin) tampoco puede leer lead_submissions",
      editorReadSubmissions.status === 401 || editorReadSubmissions.status === 403 || (editorReadSubmissions.status === 200 && editorReadSubmissions.json.length === 0),
      JSON.stringify(editorReadSubmissions)
    );

    const superAdminReadSubmissions = await rest(`lead_submissions?select=id&id=eq.${submissionId}`, { key: superAdminUser.accessToken, extraHeaders: { apikey: ANON_KEY } });
    check("super_admin SÍ puede leer lead_submissions", superAdminReadSubmissions.status === 200 && superAdminReadSubmissions.json.length === 1, JSON.stringify(superAdminReadSubmissions));

    const crossNicheRoute = await rest("lead_routes", {
      key: editorUser.accessToken,
      method: "POST",
      body: { lead_form_id: publishedFormId, vendor_id: vendorTravelId, routing_rule: {} },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("lead_routes RECHAZA un vendor de un niche distinto al del lead_form", crossNicheRoute.status === 401 || crossNicheRoute.status === 403, JSON.stringify(crossNicheRoute));

    const sameNicheRoute = await rest("lead_routes", {
      key: editorUser.accessToken,
      method: "POST",
      body: { lead_form_id: publishedFormId, vendor_id: vendorSoftwareId, routing_rule: {} },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("lead_routes ACEPTA un vendor del mismo niche que el lead_form", sameNicheRoute.status === 201, JSON.stringify(sameNicheRoute));

    // ================= REVENUE EVENTS =================
    const editorImportAttempt = await rest("rpc/import_revenue_events", {
      key: editorUser.accessToken,
      method: "POST",
      body: { rows: [{ event_id: `p5-evt-${stamp}-a`, event_type: "affiliate_commission", amount: "10.00" }] },
      extraHeaders: { apikey: ANON_KEY },
    });
    check("editor (no super_admin) NO puede llamar import_revenue_events en absoluto", editorImportAttempt.status >= 400, JSON.stringify(editorImportAttempt));

    const eventId = `p5-evt-${stamp}-a`;
    const firstImport = await rest("rpc/import_revenue_events", {
      key: superAdminUser.accessToken,
      method: "POST",
      body: { rows: [{ event_id: eventId, event_type: "affiliate_commission", site_id: softwareSiteId, amount: "10.00" }] },
      extraHeaders: { apikey: ANON_KEY },
    });
    const firstImportRows = Array.isArray(firstImport.json) ? firstImport.json : [];
    check("super_admin puede importar un revenue_event válido", firstImport.status === 200 && firstImportRows[0]?.status === "accepted", JSON.stringify(firstImport));
    if (firstImportRows[0]?.event_row_id) cleanup.revenueEventIds.push(firstImportRows[0].event_row_id);

    const secondImport = await rest("rpc/import_revenue_events", {
      key: superAdminUser.accessToken,
      method: "POST",
      body: { rows: [{ event_id: eventId, event_type: "affiliate_commission", site_id: softwareSiteId, amount: "10.00" }] },
      extraHeaders: { apikey: ANON_KEY },
    });
    const secondImportRows = Array.isArray(secondImport.json) ? secondImport.json : [];
    check(
      "reimportar el MISMO event_id no duplica — status=duplicate",
      secondImport.status === 200 && secondImportRows[0]?.status === "duplicate",
      JSON.stringify(secondImport)
    );

    const eventCount = await rest(`revenue_events?select=id&event_id=eq.${eventId}`, { key: SERVICE_KEY });
    check("solo existe UNA fila en revenue_events para ese event_id", eventCount.status === 200 && eventCount.json.length === 1, JSON.stringify(eventCount));
  } finally {
    // Cleanup — corre siempre (patrón F-03 de Fase 2, ADR-012: sin preview DB).
    for (const id of cleanup.revenueEventIds) {
      await rest(`revenue_events?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    await rest(`revenue_events?event_id=like.p5-evt-${stamp}-*`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const id of cleanup.leadFormIds) {
      await rest(`lead_submissions?lead_form_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`lead_routes?lead_form_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`lead_forms?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.sponsoredCampaignIds) {
      await rest(`sponsorship_placements?campaign_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`sponsored_campaigns?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    await rest(`monetization_rules?site_id=eq.${(await rest("sites?select=id&slug=eq.software-ai", { key: SERVICE_KEY })).json?.[0]?.id}&page_type=eq.review`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    await rest(`roe_scores?rule_version=eq.v1`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    for (const id of cleanup.affiliateLinkIds) {
      await rest(`affiliate_clicks?affiliate_link_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`affiliate_links?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.affiliateProgramIds) {
      await rest(`affiliate_offers?program_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`affiliate_terms?program_id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
      await rest(`affiliate_programs?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.contentItemIds) {
      await rest(`content_items?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.productIds) {
      await rest(`products?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
    }
    for (const id of cleanup.vendorIds) {
      await rest(`vendors?id=eq.${id}`, { key: SERVICE_KEY, method: "DELETE" }).catch(() => {});
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
