import type { Dictionary } from "./dictionary";

export const en: Dictionary = {
  common: {
    skipToContent: "Skip to main content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    searchLabel: "Search products, comparisons, or guides",
    searchPlaceholder: "Search comparisons, products…",
    searchButton: "Search",
    backToDiscover: "← Back to Discover",
    languageSwitcherLabel: "Language",
    lastReviewedLabel: "Last reviewed",
  },
  nav: {
    primary: "Primary",
    primaryMobile: "Primary (mobile)",
    discover: "Discover",
  },
  footer: {
    taglineSuffix:
      "Visible methodology, cited sources, and a clear line between editorial and sponsored — not another affiliate blog.",
    verticalsHeading: "Verticals",
    legalHeading: "Legal",
    legal: {
      about: "About & Methodology",
      editorialPolicy: "Editorial Policy",
      affiliateDisclosure: "Affiliate Disclosure",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
    copyrightPrefix:
      "Some links on this site are affiliate links — see our",
    copyrightLinkLabel: "Affiliate Disclosure",
  },
  home: {
    metaTitleSuffix: "Decide with evidence, not guesswork",
    metaDescription:
      "{brand} compares business software, travel, and consumer tech with visible methodology and cited sources — not another affiliate blog.",
    h1: "Decide with evidence, not guesswork.",
    intro:
      "{brand} compares software, travel, and consumer tech the way a careful analyst would — visible methodology, cited sources, and a hard line between what we recommend and what we get paid for.",
    verticalsHeading: "Where do you want to start?",
    methodologyHeading: "How we work",
    principles: [
      {
        title: "Methodology first",
        body: "Every comparison states how we evaluated it before it states what we recommend — the criteria, not just the conclusion.",
      },
      {
        title: "Sources, not vibes",
        body: "Prices, specs, and terms are cited with a checked-on date. Nothing gets asserted without a source we can point to.",
      },
      {
        title: "Commission never ranks",
        body: "Affiliate commission decides what we can afford to build; it never decides which option we recommend first.",
      },
      {
        title: "Sponsored is labeled, always",
        body: "Paid placements are visually separated from editorial recommendations — never mixed into the ranking itself.",
      },
    ],
    footerNotePrefix: "Read the full",
    footerNoteMethodologyLink: "methodology",
    footerNoteMiddle: "or how we handle",
    footerNoteAffiliateLink: "affiliate relationships",
    footerNoteSuffix: ".",
  },
  discover: {
    metaTitle: "Discover",
    metaDescription:
      "Browse comparisons and buying guides by vertical and category.",
    h1: "Discover",
    intro:
      "Every comparison lives under a vertical and a category. Start broad — pick a vertical below — or go straight to a category once you know what you're deciding on.",
    waveNotePrefix:
      "We publish verticals in waves so each one gets real depth instead of thin coverage — see",
    waveNoteLink: "our methodology",
    waveNoteSuffix: "for how we decide what's ready to publish.",
  },
  nicheHub: {
    kicker: "Vertical",
    inDevelopmentPrefix: "This vertical is in active development —",
    inDevelopmentSuffix:
      "comparisons and buying guides publish here as they clear our editorial and monetization review.",
    methodologyLink: "See our publishing methodology",
    categoriesHeading: "Categories",
  },
  search: {
    metaTitle: "Search",
    h1: "Search",
    submitLabel: "Search",
    emptyPrompt:
      "Search indexes published comparisons across every vertical. Nothing typed yet — or browse directly:",
    noResultsPrefix: "No published comparisons match",
    noResultsSuffix:
      "yet — this vertical may still be in development. Try browsing by category instead.",
  },
  legal: {
    about: {
      metaTitle: "About & Methodology",
      metaDescription:
        "How {brand} evaluates and ranks recommendations — visible methodology, cited sources, and the line between editorial and sponsored content.",
      title: "About & Methodology",
      lastUpdated: "August 2026",
      whatIsHeading: "What {brand} is",
      whatIsBody:
        "{brand} is a comparison and decision platform across three verticals: business software & AI, travel, and consumer tech. We exist to help you decide, not to fill a feed — every commercial page is built to answer a specific question with evidence, not to maximize time on site.",
      scoringHeading: "How we score and rank",
      scoringBodyPrefix:
        "Every recommendation is driven by a Quality Score based on published criteria, sourced specifications, and — where we've done it — hands-on testing. That score is independent from how a recommendation is monetized. A Monetization Score determines placement and calls-to-action within limits we set publicly, but it never changes which option ranks first. If a page ever looks inconsistent with that principle, tell us — see our",
      scoringLinkLabel: "Editorial Policy",
      scoringBodySuffix: ".",
      sourcesHeading: "Sources and freshness",
      sourcesBody:
        "Prices, specifications, and program terms are recorded with a source and a checked-on date. We don't overwrite history — price and feature changes are kept as a timeline, not silently replaced. Pages past their freshness window are flagged for review before they're treated as current.",
      dontHeading: "What we don't do",
      dontItems: [
        "We don't publish auto-generated content without human review.",
        "We don't claim to have tested something we haven't.",
        "We don't mix sponsored placements into editorial rankings without a clear label.",
      ],
      dontAffiliateItemPrefix:
        "We don't let affiliate commission move a recommendation's rank — see our",
      dontAffiliateLinkLabel: "Affiliate Disclosure",
    },
    editorialPolicy: {
      metaTitle: "Editorial Policy",
      metaDescription:
        "The editorial standards that govern every {brand} recommendation, independent of commercial relationships.",
      title: "Editorial Policy",
      lastUpdated: "August 2026",
      independenceHeading: "Editorial independence",
      independenceBody:
        "{brand}'s recommendations are based on our published evaluation criteria and available evidence. Commercial relationships — affiliate commission, sponsorships, or vendor subscriptions — never determine which option we recommend or how it ranks against alternatives.",
      sourcingHeading: "Sourcing standards",
      sourcingBody:
        "Factual claims about pricing, specifications, or program terms carry a source and a checked-on date. Where we haven't independently verified a claim, we say so rather than presenting it as confirmed.",
      aiHeading: "AI-assisted content",
      aiBody:
        "Some drafting and research is assisted by AI tools, but no page that carries advertising or affiliate links publishes without human review and approval first. We don't treat AI output as publish-ready on its own.",
      correctionsHeading: "Corrections",
      correctionsBody:
        "When we get something wrong, we correct it and note the change on the affected page rather than quietly editing it away. If you spot an error, you can reach us through the contact details on this site once they're published.",
      sponsoredHeading: "Sponsored content",
      sponsoredBody:
        'Sponsored placements are visually separated from editorial recommendations and labeled "Sponsored" without exception. A sponsored placement is never presented as an editorial ranking result.',
    },
    affiliateDisclosure: {
      metaTitle: "Affiliate Disclosure",
      metaDescription:
        "How {brand} makes money through affiliate commissions, display advertising, and sponsored placements — and what commission never decides.",
      title: "Affiliate Disclosure",
      lastUpdated: "August 2026",
      howHeading: "How we make money",
      howBody:
        "{brand} earns revenue primarily through affiliate commissions: when you click certain links and sign up for or purchase a product we recommend, we may earn a commission from that merchant at no additional cost to you. We also run display advertising on informational pages, and — for select verticals — connect readers with vendors through lead forms.",
      whatNotHeading: "What commission does not do",
      whatNotBodyPrefix:
        "Commission rate never determines which product we recommend first. Our Quality Score and our Monetization Score are calculated independently — see",
      whatNotLinkLabel: "our methodology",
      whatNotBodySuffix:
        "— and only the Quality Score determines editorial ranking.",
      sponsoredHeading: "Sponsored placements",
      sponsoredBody:
        'Where we accept sponsored placements, they are visually separated from editorial content and labeled "Sponsored." A sponsored placement is never presented as, or mixed into, an editorial ranking.',
      identifyingHeading: "Identifying affiliate links",
      identifyingBody:
        "Pages that contain affiliate links carry a disclosure near the relevant recommendations. If you have questions about a specific link or program, the merchant and program name are part of our internal records and can be requested through our contact details once published.",
    },
    privacy: {
      metaTitle: "Privacy Policy",
      metaDescription:
        "What {brand} collects, why, and how it's protected — a working draft ahead of public launch.",
      title: "Privacy Policy",
      lastUpdated: "August 2026",
      draftNotice:
        "This is a working draft of our privacy practices, published ahead of public launch. It will be reviewed by legal counsel and finalized — including jurisdiction-specific consent requirements — before {brand} accepts real user accounts or ad serving at scale.",
      collectHeading: "What we collect",
      collectBody:
        "If you create an account, we collect your email, a display name you choose, and preferences you set (such as newsletter opt-in and locale). If you submit a lead form to a vendor, we collect what that form asks for and pass it to the relevant vendor as disclosed on the form itself.",
      minimizationHeading: "Data minimization",
      minimizationBody:
        "We collect what a feature needs and no more. Personal data is protected by database-level access rules — not just interface restrictions — so that only the systems and roles that need it can read it.",
      cookiesHeading: "Cookies and analytics",
      cookiesBody:
        "We use session identifiers to measure which pages and recommendations perform, and to attribute affiliate clicks and conversions accurately. We do not sell personal data to third parties.",
      choicesHeading: "Your choices",
      choicesBody:
        "Once accounts are live, you'll be able to view, export, and delete your account data from your preferences. Until then, this page describes intent, not a live self-service flow.",
    },
    terms: {
      metaTitle: "Terms of Service",
      metaDescription:
        "The terms that govern use of {brand} — a working draft ahead of public launch.",
      title: "Terms of Service",
      lastUpdated: "August 2026",
      draftNotice:
        "This is a working draft published ahead of public launch. It will be reviewed by legal counsel and finalized before {brand} operates at scale.",
      useHeading: "Use of this site",
      useBody:
        "{brand} provides comparisons, buying guides, and tools to help you evaluate products and services. Content is informational — we don't guarantee that any product will meet your specific needs, and pricing or availability shown here may change after our last review date on that page.",
      accountsHeading: "Accounts",
      accountsBody:
        "When account creation is live, you'll be responsible for the accuracy of the information you provide and for keeping your credentials secure.",
      affiliateHeading: "Affiliate and sponsored content",
      affiliateBodyPrefix:
        "Some links on this site are affiliate links, and some placements are sponsored. Both are disclosed — see our",
      affiliateLinkLabel: "Affiliate Disclosure",
      affiliateBodySuffix: ". Using those links doesn't change the price you pay.",
      liabilityHeading: "Limitation of liability",
      liabilityBody:
        "This section will be finalized with legal counsel before launch to reflect the jurisdictions we operate in.",
    },
  },
  niches: {
    "business-software-ai": {
      name: "Business Software & AI",
      shortName: "Software & AI",
      description:
        "CRM, AI assistants, automation, SEO & marketing software, website & e-commerce, and productivity — comparisons built for SMBs, agencies, and commercial teams.",
      categories: [
        "CRM",
        "AI assistants",
        "Automation",
        "SEO & marketing software",
        "Website & e-commerce",
        "Productivity",
      ],
    },
    "travel-smart-travel": {
      name: "Travel & Smart Travel",
      shortName: "Travel",
      description:
        "Hotels, destinations, itineraries, eSIM & connectivity, luggage, and travel tech — trip decisions backed by evidence, not just opinion.",
      categories: [
        "Hotels",
        "Destinations",
        "Itineraries",
        "eSIM & connectivity",
        "Luggage",
        "Travel tech",
      ],
    },
    "consumer-tech-smart-home": {
      name: "Consumer Tech & Smart Home",
      shortName: "Consumer Tech",
      description:
        "Smart home, networking, audio, monitors, accessories, and home office — what to buy, compared against verified specifications.",
      categories: [
        "Smart home",
        "Networking",
        "Audio",
        "Monitors",
        "Accessories",
        "Home office",
      ],
    },
  },
  catalog: {
    startingAt: "Starting at",
    perMonth: "/month",
    perYear: "/year",
    visitWebsite: "Visit website",
    viewDetails: "View details",
    backToCategory: "← Back to {category}",
    sourceLabel: "Source",
    lastCheckedLabel: "Last checked",
    noProductsYet: "No products published in this category yet.",
    featuresHeading: "Features",
    pricingHeading: "Pricing",
    methodologyNote: "Prices and features are cited with a source and a checked-on date — see our methodology.",
  },
  tools: {
    crmComparatorTitle: "CRM Pricing Comparator",
    crmComparatorIntro: "Select the CRMs you're evaluating to compare entry-tier pricing and free-tier availability side by side.",
    selectToCompare: "Select to compare",
    entryPlanColumn: "Entry plan",
    priceColumn: "Starting price",
    freeTierColumn: "Free tier",
    billingModelColumn: "Billing",
    integrationsColumn: "Integrations",
    noSelection: "Select at least one CRM above to see a comparison.",
    esimComparatorTitle: "eSIM Data Plan Comparator",
    esimComparatorIntro: "Select the eSIM providers you're evaluating to compare entry-tier price, data model, and coverage side by side.",
    dataModelColumn: "Data model",
    largestPlanColumn: "Largest plan",
    coverageColumn: "Coverage",
  },
};
