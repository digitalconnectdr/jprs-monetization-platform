import type { Dictionary } from "./dictionary";

export const fr: Dictionary = {
  common: {
    skipToContent: "Aller au contenu principal",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    searchLabel: "Rechercher des produits, comparatifs ou guides",
    searchPlaceholder: "Rechercher des comparatifs, produits…",
    searchButton: "Rechercher",
    backToDiscover: "← Retour à Découvrir",
    languageSwitcherLabel: "Langue",
    lastReviewedLabel: "Dernière révision",
  },
  nav: {
    primary: "Navigation principale",
    primaryMobile: "Navigation principale (mobile)",
    discover: "Découvrir",
  },
  footer: {
    taglineSuffix:
      "Méthodologie visible, sources citées et une séparation claire entre l'éditorial et le sponsorisé — pas un blog d'affiliation de plus.",
    verticalsHeading: "Verticales",
    legalHeading: "Mentions légales",
    legal: {
      about: "À propos et méthodologie",
      editorialPolicy: "Politique éditoriale",
      affiliateDisclosure: "Divulgation d'affiliation",
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
    },
    copyrightPrefix:
      "Certains liens de ce site sont des liens d'affiliation — voir notre",
    copyrightLinkLabel: "Divulgation d'affiliation",
  },
  home: {
    metaTitleSuffix: "Décidez avec des preuves, pas des suppositions",
    metaDescription:
      "{brand} compare les logiciels professionnels, les voyages et la tech grand public avec une méthodologie visible et des sources citées — pas un blog d'affiliation de plus.",
    h1: "Décidez avec des preuves, pas des suppositions.",
    intro:
      "{brand} compare les logiciels, les voyages et la tech grand public comme le ferait un analyste rigoureux — méthodologie visible, sources citées, et une ligne claire entre ce que nous recommandons et ce pour quoi nous sommes payés.",
    verticalsHeading: "Par où voulez-vous commencer ?",
    methodologyHeading: "Comment nous travaillons",
    principles: [
      {
        title: "La méthodologie d'abord",
        body: "Chaque comparatif explique comment nous avons évalué avant de dire ce que nous recommandons — le critère, pas seulement la conclusion.",
      },
      {
        title: "Des sources, pas des impressions",
        body: "Prix, spécifications et conditions sont cités avec une date de vérification. Rien n'est affirmé sans une source que nous pouvons montrer.",
      },
      {
        title: "La commission ne décide jamais du classement",
        body: "La commission d'affiliation finance ce que nous pouvons construire ; elle ne décide jamais quelle option nous recommandons en premier.",
      },
      {
        title: "Le sponsorisé est toujours étiqueté",
        body: "Les placements payants sont visuellement séparés des recommandations éditoriales — jamais mélangés au classement lui-même.",
      },
    ],
    footerNotePrefix: "Lisez la",
    footerNoteMethodologyLink: "méthodologie complète",
    footerNoteMiddle: "ou comment nous gérons les",
    footerNoteAffiliateLink: "relations d'affiliation",
    footerNoteSuffix: ".",
  },
  discover: {
    metaTitle: "Découvrir",
    metaDescription:
      "Parcourez les comparatifs et guides d'achat par verticale et catégorie.",
    h1: "Découvrir",
    intro:
      "Chaque comparatif appartient à une verticale et une catégorie. Commencez large — choisissez une verticale ci-dessous — ou allez directement à une catégorie si vous savez déjà ce que vous décidez.",
    waveNotePrefix:
      "Nous publions les verticales par vagues afin que chacune ait une réelle profondeur plutôt qu'une couverture superficielle — voir",
    waveNoteLink: "notre méthodologie",
    waveNoteSuffix: "pour savoir comment nous décidons ce qui est prêt à être publié.",
  },
  nicheHub: {
    kicker: "Verticale",
    inDevelopmentPrefix: "Cette verticale est en développement actif —",
    inDevelopmentSuffix:
      "les comparatifs et guides d'achat sont publiés ici au fur et à mesure qu'ils passent notre revue éditoriale et de monétisation.",
    methodologyLink: "Voir notre méthodologie de publication",
    categoriesHeading: "Catégories",
  },
  search: {
    metaTitle: "Rechercher",
    h1: "Rechercher",
    submitLabel: "Rechercher",
    emptyPrompt:
      "La recherche indexe les comparatifs publiés dans toutes les verticales. Rien de saisi encore — ou parcourez directement :",
    noResultsPrefix: "Aucun comparatif publié ne correspond à",
    noResultsSuffix:
      "pour l'instant — cette verticale est peut-être encore en développement. Essayez de parcourir par catégorie.",
  },
  legal: {
    about: {
      metaTitle: "À propos et méthodologie",
      metaDescription:
        "Comment {brand} évalue et classe ses recommandations — méthodologie visible, sources citées, et la ligne entre contenu éditorial et sponsorisé.",
      title: "À propos et méthodologie",
      lastUpdated: "août 2026",
      whatIsHeading: "Ce qu'est {brand}",
      whatIsBody:
        "{brand} est une plateforme de comparaison et de décision couvrant trois verticales : logiciels professionnels et IA, voyages, et tech grand public. Nous existons pour vous aider à décider, pas pour remplir un fil d'actualité — chaque page commerciale est conçue pour répondre à une question précise avec des preuves, pas pour maximiser le temps passé sur le site.",
      scoringHeading: "Comment nous notons et classons",
      scoringBodyPrefix:
        "Chaque recommandation repose sur un Quality Score basé sur des critères publiés, des spécifications sourcées et — quand nous l'avons fait — des tests pratiques. Ce score est indépendant de la façon dont une recommandation est monétisée. Un Monetization Score détermine le placement et les appels à l'action dans des limites que nous fixons publiquement, mais il ne change jamais quelle option arrive en premier. Si une page semble incohérente avec ce principe, dites-le-nous — voir notre",
      scoringLinkLabel: "Politique éditoriale",
      scoringBodySuffix: ".",
      sourcesHeading: "Sources et fraîcheur",
      sourcesBody:
        "Prix, spécifications et conditions des programmes sont enregistrés avec une source et une date de vérification. Nous ne réécrivons pas l'historique — les changements de prix et de caractéristiques sont conservés comme une chronologie, jamais remplacés silencieusement. Les pages dépassant leur fenêtre de fraîcheur sont signalées pour révision avant d'être considérées comme à jour.",
      dontHeading: "Ce que nous ne faisons pas",
      dontItems: [
        "Nous ne publions pas de contenu généré automatiquement sans révision humaine.",
        "Nous n'affirmons pas avoir testé quelque chose que nous n'avons pas testé.",
        "Nous ne mélangeons pas les placements sponsorisés dans les classements éditoriaux sans étiquette claire.",
      ],
      dontAffiliateItemPrefix:
        "Nous ne laissons jamais la commission d'affiliation modifier le classement d'une recommandation — voir notre",
      dontAffiliateLinkLabel: "Divulgation d'affiliation",
    },
    editorialPolicy: {
      metaTitle: "Politique éditoriale",
      metaDescription:
        "Les normes éditoriales qui régissent chaque recommandation de {brand}, indépendamment des relations commerciales.",
      title: "Politique éditoriale",
      lastUpdated: "août 2026",
      independenceHeading: "Indépendance éditoriale",
      independenceBody:
        "Les recommandations de {brand} reposent sur nos critères d'évaluation publiés et les preuves disponibles. Les relations commerciales — commission d'affiliation, parrainages ou abonnements de fournisseurs — ne déterminent jamais quelle option nous recommandons ni son classement face aux alternatives.",
      sourcingHeading: "Normes de sourçage",
      sourcingBody:
        "Les affirmations factuelles sur les prix, spécifications ou conditions de programme comportent une source et une date de vérification. Lorsque nous n'avons pas vérifié une affirmation de manière indépendante, nous le précisons plutôt que de la présenter comme confirmée.",
      aiHeading: "Contenu assisté par IA",
      aiBody:
        "Une partie de la rédaction et de la recherche est assistée par des outils d'IA, mais aucune page portant de la publicité ou des liens d'affiliation n'est publiée sans révision et approbation humaines préalables. Nous ne considérons jamais le résultat de l'IA comme publiable tel quel.",
      correctionsHeading: "Corrections",
      correctionsBody:
        "Lorsque nous nous trompons, nous corrigeons et notons le changement sur la page concernée plutôt que de le modifier discrètement. Si vous repérez une erreur, vous pourrez nous contacter via les coordonnées de ce site dès leur publication.",
      sponsoredHeading: "Contenu sponsorisé",
      sponsoredBody:
        "Les placements sponsorisés sont visuellement séparés des recommandations éditoriales et étiquetés « Sponsorisé » sans exception. Un placement sponsorisé n'est jamais présenté comme un résultat de classement éditorial.",
    },
    affiliateDisclosure: {
      metaTitle: "Divulgation d'affiliation",
      metaDescription:
        "Comment {brand} génère des revenus via les commissions d'affiliation, la publicité display et les placements sponsorisés — et ce que la commission ne décide jamais.",
      title: "Divulgation d'affiliation",
      lastUpdated: "août 2026",
      howHeading: "Comment nous générons des revenus",
      howBody:
        "{brand} génère des revenus principalement via des commissions d'affiliation : lorsque vous cliquez sur certains liens et vous inscrivez ou achetez un produit que nous recommandons, nous pouvons percevoir une commission de ce marchand sans coût supplémentaire pour vous. Nous diffusons aussi de la publicité display sur les pages informatives et, pour certaines verticales, mettons en relation les lecteurs avec des fournisseurs via des formulaires de contact.",
      whatNotHeading: "Ce que la commission ne fait pas",
      whatNotBodyPrefix:
        "Le taux de commission ne détermine jamais quel produit nous recommandons en premier. Notre Quality Score et notre Monetization Score sont calculés indépendamment — voir",
      whatNotLinkLabel: "notre méthodologie",
      whatNotBodySuffix:
        "— et seul le Quality Score détermine le classement éditorial.",
      sponsoredHeading: "Placements sponsorisés",
      sponsoredBody:
        "Lorsque nous acceptons des placements sponsorisés, ils sont visuellement séparés du contenu éditorial et étiquetés « Sponsorisé ». Un placement sponsorisé n'est jamais présenté comme, ni mélangé à, un classement éditorial.",
      identifyingHeading: "Identifier les liens d'affiliation",
      identifyingBody:
        "Les pages contenant des liens d'affiliation portent une divulgation à proximité des recommandations concernées. Pour toute question sur un lien ou programme spécifique, le marchand et le nom du programme font partie de nos registres internes et peuvent être demandés via nos coordonnées dès leur publication.",
    },
    privacy: {
      metaTitle: "Politique de confidentialité",
      metaDescription:
        "Ce que {brand} collecte, pourquoi, et comment c'est protégé — un brouillon de travail avant le lancement public.",
      title: "Politique de confidentialité",
      lastUpdated: "août 2026",
      draftNotice:
        "Ceci est un brouillon de travail de nos pratiques de confidentialité, publié avant le lancement public. Il sera révisé par un conseil juridique et finalisé — y compris les exigences de consentement spécifiques à chaque juridiction — avant que {brand} n'accepte de vrais comptes utilisateurs ou de la diffusion publicitaire à grande échelle.",
      collectHeading: "Ce que nous collectons",
      collectBody:
        "Si vous créez un compte, nous collectons votre e-mail, un nom d'affichage de votre choix, et les préférences que vous définissez (comme l'inscription à la newsletter et la langue). Si vous soumettez un formulaire de contact à un fournisseur, nous collectons ce que ce formulaire demande et le transmettons au fournisseur concerné, comme indiqué sur le formulaire lui-même.",
      minimizationHeading: "Minimisation des données",
      minimizationBody:
        "Nous collectons ce dont une fonctionnalité a besoin, et rien de plus. Les données personnelles sont protégées par des règles d'accès au niveau de la base de données — pas seulement des restrictions d'interface — afin que seuls les systèmes et rôles qui en ont besoin puissent les lire.",
      cookiesHeading: "Cookies et analytique",
      cookiesBody:
        "Nous utilisons des identifiants de session pour mesurer quelles pages et recommandations fonctionnent le mieux, et pour attribuer avec précision les clics et conversions d'affiliation. Nous ne vendons pas de données personnelles à des tiers.",
      choicesHeading: "Vos choix",
      choicesBody:
        "Une fois les comptes actifs, vous pourrez consulter, exporter et supprimer les données de votre compte depuis vos préférences. En attendant, cette page décrit une intention, pas un flux libre-service opérationnel.",
    },
    terms: {
      metaTitle: "Conditions d'utilisation",
      metaDescription:
        "Les conditions qui régissent l'utilisation de {brand} — un brouillon de travail avant le lancement public.",
      title: "Conditions d'utilisation",
      lastUpdated: "août 2026",
      draftNotice:
        "Ceci est un brouillon de travail publié avant le lancement public. Il sera révisé par un conseil juridique et finalisé avant que {brand} n'opère à grande échelle.",
      useHeading: "Utilisation de ce site",
      useBody:
        "{brand} propose des comparatifs, guides d'achat et outils pour vous aider à évaluer produits et services. Le contenu est informatif — nous ne garantissons pas qu'un produit répondra à votre besoin spécifique, et le prix ou la disponibilité indiqués ici peuvent changer après la dernière date de révision de cette page.",
      accountsHeading: "Comptes",
      accountsBody:
        "Lorsque la création de compte sera active, vous serez responsable de l'exactitude des informations fournies et de la sécurité de vos identifiants.",
      affiliateHeading: "Contenu d'affiliation et sponsorisé",
      affiliateBodyPrefix:
        "Certains liens de ce site sont des liens d'affiliation, et certains placements sont sponsorisés. Les deux sont divulgués — voir notre",
      affiliateLinkLabel: "Divulgation d'affiliation",
      affiliateBodySuffix: ". L'utilisation de ces liens ne change pas le prix que vous payez.",
      liabilityHeading: "Limitation de responsabilité",
      liabilityBody:
        "Cette section sera finalisée avec un conseil juridique avant le lancement pour refléter les juridictions dans lesquelles nous opérons.",
    },
  },
  niches: {
    "business-software-ai": {
      name: "Logiciels professionnels et IA",
      shortName: "Logiciels et IA",
      description:
        "CRM, assistants IA, automatisation, logiciels de SEO et marketing, site web et e-commerce, et productivité — des comparatifs conçus pour les PME, agences et équipes commerciales.",
      categories: [
        "CRM",
        "Assistants IA",
        "Automatisation",
        "SEO et marketing",
        "Site web et e-commerce",
        "Productivité",
      ],
    },
    "travel-smart-travel": {
      name: "Voyages et Travel Tech",
      shortName: "Voyages",
      description:
        "Hôtels, destinations, itinéraires, eSIM et connectivité, bagages et travel tech — des décisions de voyage étayées par des preuves, pas seulement des opinions.",
      categories: [
        "Hôtels",
        "Destinations",
        "Itinéraires",
        "eSIM et connectivité",
        "Bagages",
        "Travel tech",
      ],
    },
    "consumer-tech-smart-home": {
      name: "Tech grand public et maison connectée",
      shortName: "Technologie",
      description:
        "Maison connectée, réseau, audio, moniteurs, accessoires et bureau à domicile — quoi acheter, comparé à des spécifications vérifiées.",
      categories: [
        "Maison connectée",
        "Réseau",
        "Audio",
        "Moniteurs",
        "Accessoires",
        "Bureau à domicile",
      ],
    },
  },
  catalog: {
    startingAt: "À partir de",
    perMonth: "/mois",
    perYear: "/an",
    visitWebsite: "Visiter le site",
    viewDetails: "Voir les détails",
    backToCategory: "← Retour à {category}",
    sourceLabel: "Source",
    lastCheckedLabel: "Dernière vérification",
    noProductsYet: "Aucun produit publié dans cette catégorie pour le moment.",
    featuresHeading: "Caractéristiques",
    pricingHeading: "Tarifs",
    methodologyNote: "Les prix et caractéristiques sont cités avec une source et une date de vérification — voir notre méthodologie.",
  },
  tools: {
    crmComparatorTitle: "Comparateur de prix CRM",
    crmComparatorIntro: "Sélectionnez les CRM que vous évaluez pour comparer le prix du plan d'entrée et la disponibilité d'un plan gratuit, côte à côte.",
    selectToCompare: "Sélectionner pour comparer",
    entryPlanColumn: "Plan d'entrée",
    priceColumn: "Prix de départ",
    freeTierColumn: "Plan gratuit",
    billingModelColumn: "Facturation",
    integrationsColumn: "Intégrations",
    noSelection: "Sélectionnez au moins un CRM ci-dessus pour voir une comparaison.",
    esimComparatorTitle: "Comparateur de forfaits eSIM",
    esimComparatorIntro: "Sélectionnez les fournisseurs eSIM que vous évaluez pour comparer le prix d'entrée, le modèle de données et la couverture côte à côte.",
    dataModelColumn: "Modèle de données",
    largestPlanColumn: "Plus grand forfait",
    coverageColumn: "Couverture",
  },
};
