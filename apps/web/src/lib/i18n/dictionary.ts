export type NicheCopy = {
  name: string;
  shortName: string;
  description: string;
  categories: string[];
};

export type Dictionary = {
  common: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    searchLabel: string;
    searchPlaceholder: string;
    searchButton: string;
    backToDiscover: string;
    languageSwitcherLabel: string;
    lastReviewedLabel: string;
  };
  nav: {
    primary: string;
    primaryMobile: string;
    discover: string;
  };
  footer: {
    taglineSuffix: string;
    verticalsHeading: string;
    legalHeading: string;
    legal: {
      about: string;
      editorialPolicy: string;
      affiliateDisclosure: string;
      privacy: string;
      terms: string;
    };
    copyrightPrefix: string;
    copyrightLinkLabel: string;
  };
  home: {
    metaTitleSuffix: string;
    h1: string;
    intro: string;
    verticalsHeading: string;
    methodologyHeading: string;
    principles: { title: string; body: string }[];
    footerNotePrefix: string;
    footerNoteMethodologyLink: string;
    footerNoteMiddle: string;
    footerNoteAffiliateLink: string;
    footerNoteSuffix: string;
  };
  discover: {
    metaTitle: string;
    metaDescription: string;
    h1: string;
    intro: string;
    waveNotePrefix: string;
    waveNoteLink: string;
    waveNoteSuffix: string;
  };
  nicheHub: {
    kicker: string;
    inDevelopmentPrefix: string;
    inDevelopmentSuffix: string;
    methodologyLink: string;
    categoriesHeading: string;
  };
  search: {
    metaTitle: string;
    h1: string;
    submitLabel: string;
    emptyPrompt: string;
    noResultsPrefix: string;
    noResultsSuffix: string;
  };
  legal: {
    about: {
      metaTitle: string;
      title: string;
      lastUpdated: string;
      whatIsHeading: string;
      whatIsBody: string;
      scoringHeading: string;
      scoringBodyPrefix: string;
      scoringLinkLabel: string;
      scoringBodySuffix: string;
      sourcesHeading: string;
      sourcesBody: string;
      dontHeading: string;
      dontItems: string[];
      dontAffiliateItemPrefix: string;
      dontAffiliateLinkLabel: string;
    };
    editorialPolicy: {
      metaTitle: string;
      title: string;
      lastUpdated: string;
      independenceHeading: string;
      independenceBody: string;
      sourcingHeading: string;
      sourcingBody: string;
      aiHeading: string;
      aiBody: string;
      correctionsHeading: string;
      correctionsBody: string;
      sponsoredHeading: string;
      sponsoredBody: string;
    };
    affiliateDisclosure: {
      metaTitle: string;
      title: string;
      lastUpdated: string;
      howHeading: string;
      howBody: string;
      whatNotHeading: string;
      whatNotBodyPrefix: string;
      whatNotLinkLabel: string;
      whatNotBodySuffix: string;
      sponsoredHeading: string;
      sponsoredBody: string;
      identifyingHeading: string;
      identifyingBody: string;
    };
    privacy: {
      metaTitle: string;
      title: string;
      lastUpdated: string;
      draftNotice: string;
      collectHeading: string;
      collectBody: string;
      minimizationHeading: string;
      minimizationBody: string;
      cookiesHeading: string;
      cookiesBody: string;
      choicesHeading: string;
      choicesBody: string;
    };
    terms: {
      metaTitle: string;
      title: string;
      lastUpdated: string;
      draftNotice: string;
      useHeading: string;
      useBody: string;
      accountsHeading: string;
      accountsBody: string;
      affiliateHeading: string;
      affiliateBodyPrefix: string;
      affiliateLinkLabel: string;
      affiliateBodySuffix: string;
      liabilityHeading: string;
      liabilityBody: string;
    };
  };
  niches: Record<string, NicheCopy>;
};
