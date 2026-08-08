import type { Dictionary } from "./dictionary";

export const pt: Dictionary = {
  common: {
    skipToContent: "Pular para o conteúdo principal",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    searchLabel: "Buscar produtos, comparativos ou guias",
    searchPlaceholder: "Buscar comparativos, produtos…",
    searchButton: "Buscar",
    backToDiscover: "← Voltar para Descobrir",
    languageSwitcherLabel: "Idioma",
    lastReviewedLabel: "Última revisão",
  },
  nav: {
    primary: "Principal",
    primaryMobile: "Principal (móvel)",
    discover: "Descobrir",
  },
  footer: {
    taglineSuffix:
      "Metodologia visível, fontes citadas e uma separação clara entre o editorial e o patrocinado — não mais um blog de afiliados.",
    verticalsHeading: "Verticais",
    legalHeading: "Legal",
    legal: {
      about: "Sobre e metodologia",
      editorialPolicy: "Política editorial",
      affiliateDisclosure: "Divulgação de afiliados",
      privacy: "Política de privacidade",
      terms: "Termos de serviço",
    },
    copyrightPrefix:
      "Alguns links neste site são links de afiliados — veja nossa",
    copyrightLinkLabel: "Divulgação de afiliados",
  },
  home: {
    metaTitleSuffix: "Decida com evidências, não com suposições",
    metaDescription:
      "A {brand} compara software empresarial, viagens e tecnologia de consumo com metodologia visível e fontes citadas — não é mais um blog de afiliados.",
    h1: "Decida com evidências, não com suposições.",
    intro:
      "A {brand} compara softwares, viagens e tecnologia de consumo como faria um analista cuidadoso — metodologia visível, fontes citadas e uma linha clara entre o que recomendamos e aquilo pelo qual somos pagos.",
    verticalsHeading: "Por onde você quer começar?",
    methodologyHeading: "Como trabalhamos",
    principles: [
      {
        title: "Metodologia em primeiro lugar",
        body: "Cada comparativo mostra como avaliamos antes de dizer o que recomendamos — o critério, não só a conclusão.",
      },
      {
        title: "Fontes, não impressões",
        body: "Preços, especificações e condições são citados com data de verificação. Nada é afirmado sem uma fonte que possamos apontar.",
      },
      {
        title: "Comissão nunca decide o ranking",
        body: "A comissão de afiliados financia o que podemos construir; ela nunca decide qual opção recomendamos primeiro.",
      },
      {
        title: "Patrocinado sempre com etiqueta",
        body: "Posições pagas são separadas visualmente das recomendações editoriais — nunca misturadas ao ranking.",
      },
    ],
    footerNotePrefix: "Leia a",
    footerNoteMethodologyLink: "metodologia completa",
    footerNoteMiddle: "ou como lidamos com",
    footerNoteAffiliateLink: "relações de afiliados",
    footerNoteSuffix: ".",
  },
  discover: {
    metaTitle: "Descobrir",
    metaDescription:
      "Explore comparativos e guias de compra por vertical e categoria.",
    h1: "Descobrir",
    intro:
      "Cada comparativo vive dentro de um vertical e uma categoria. Comece amplo — escolha um vertical abaixo — ou vá direto a uma categoria se já sabe o que está decidindo.",
    waveNotePrefix:
      "Publicamos os verticais em ondas para que cada um tenha profundidade real em vez de cobertura rasa — veja",
    waveNoteLink: "nossa metodologia",
    waveNoteSuffix: "para saber como decidimos o que está pronto para publicar.",
  },
  nicheHub: {
    kicker: "Vertical",
    inDevelopmentPrefix: "Este vertical está em desenvolvimento ativo —",
    inDevelopmentSuffix:
      "comparativos e guias de compra são publicados aqui conforme passam por nossa revisão editorial e de monetização.",
    methodologyLink: "Veja nossa metodologia de publicação",
    categoriesHeading: "Categorias",
  },
  search: {
    metaTitle: "Buscar",
    h1: "Buscar",
    submitLabel: "Buscar",
    emptyPrompt:
      "A busca indexa comparativos publicados em todos os verticais. Nada digitado ainda — ou explore diretamente:",
    noResultsPrefix: "Nenhum comparativo publicado corresponde a",
    noResultsSuffix:
      "ainda — este vertical pode estar em desenvolvimento. Tente explorar por categoria.",
  },
  legal: {
    about: {
      metaTitle: "Sobre e metodologia",
      metaDescription:
        "Como a {brand} avalia e classifica suas recomendações — metodologia visível, fontes citadas e a linha entre o editorial e o patrocinado.",
      title: "Sobre e metodologia",
      lastUpdated: "agosto de 2026",
      whatIsHeading: "O que é a {brand}",
      whatIsBody:
        "A {brand} é uma plataforma de comparação e decisão em três verticais: software empresarial e IA, viagens e tecnologia de consumo. Existimos para ajudar você a decidir, não para encher um feed — cada página comercial é construída para responder a uma pergunta específica com evidências, não para maximizar o tempo no site.",
      scoringHeading: "Como pontuamos e classificamos",
      scoringBodyPrefix:
        "Cada recomendação é guiada por um Quality Score baseado em critérios publicados, especificações com fonte e — quando fizemos — testes práticos. Esse score é independente de como uma recomendação é monetizada. Um Monetization Score determina o posicionamento e as chamadas para ação dentro de limites que definimos publicamente, mas nunca muda qual opção fica em primeiro. Se alguma página parecer inconsistente com esse princípio, nos avise — veja nossa",
      scoringLinkLabel: "Política editorial",
      scoringBodySuffix: ".",
      sourcesHeading: "Fontes e atualização",
      sourcesBody:
        "Preços, especificações e condições de programas são registrados com uma fonte e uma data de verificação. Não sobrescrevemos o histórico — mudanças de preço e recursos são mantidas como linha do tempo, não substituídas em silêncio. Páginas fora da janela de atualização são marcadas para revisão antes de serem tratadas como vigentes.",
      dontHeading: "O que não fazemos",
      dontItems: [
        "Não publicamos conteúdo gerado automaticamente sem revisão humana.",
        "Não afirmamos ter testado algo que não testamos.",
        "Não misturamos posições patrocinadas nos rankings editoriais sem uma etiqueta clara.",
      ],
      dontAffiliateItemPrefix:
        "Não deixamos que a comissão de afiliados mova o ranking de uma recomendação — veja nossa",
      dontAffiliateLinkLabel: "Divulgação de afiliados",
    },
    editorialPolicy: {
      metaTitle: "Política editorial",
      metaDescription:
        "Os padrões editoriais que regem cada recomendação da {brand}, independentes de relações comerciais.",
      title: "Política editorial",
      lastUpdated: "agosto de 2026",
      independenceHeading: "Independência editorial",
      independenceBody:
        "As recomendações da {brand} se baseiam em nossos critérios de avaliação publicados e nas evidências disponíveis. Relações comerciais — comissão de afiliados, patrocínios ou assinaturas de fornecedores — nunca determinam qual opção recomendamos ou como ela se classifica frente às alternativas.",
      sourcingHeading: "Padrões de fontes",
      sourcingBody:
        "Afirmações factuais sobre preços, especificações ou condições de programas trazem uma fonte e uma data de verificação. Quando não verificamos uma afirmação de forma independente, dizemos isso em vez de apresentá-la como confirmada.",
      aiHeading: "Conteúdo assistido por IA",
      aiBody:
        "Parte da redação e pesquisa é assistida por ferramentas de IA, mas nenhuma página com publicidade ou links de afiliados é publicada sem revisão e aprovação humana prévia. Não tratamos o resultado da IA como pronto para publicar por conta própria.",
      correctionsHeading: "Correções",
      correctionsBody:
        "Quando erramos, corrigimos e registramos a mudança na página afetada em vez de editá-la silenciosamente. Se você notar um erro, poderá nos contatar pelos dados de contato deste site assim que forem publicados.",
      sponsoredHeading: "Conteúdo patrocinado",
      sponsoredBody:
        'Posições patrocinadas são separadas visualmente das recomendações editoriais e etiquetadas como "Patrocinado" sem exceção. Uma posição patrocinada nunca é apresentada como resultado de um ranking editorial.',
    },
    affiliateDisclosure: {
      metaTitle: "Divulgação de afiliados",
      metaDescription:
        "Como a {brand} gera receita por meio de comissões de afiliados, publicidade display e posições patrocinadas — e o que a comissão nunca decide.",
      title: "Divulgação de afiliados",
      lastUpdated: "agosto de 2026",
      howHeading: "Como geramos receita",
      howBody:
        "A {brand} gera receita principalmente por meio de comissões de afiliados: quando você clica em certos links e se cadastra ou compra um produto que recomendamos, podemos ganhar uma comissão daquele comerciante sem custo adicional para você. Também exibimos publicidade display em páginas informativas e, em verticais selecionados, conectamos leitores a fornecedores por meio de formulários de leads.",
      whatNotHeading: "O que a comissão não faz",
      whatNotBodyPrefix:
        "A taxa de comissão nunca determina qual produto recomendamos primeiro. Nosso Quality Score e nosso Monetization Score são calculados de forma independente — veja",
      whatNotLinkLabel: "nossa metodologia",
      whatNotBodySuffix:
        "— e apenas o Quality Score determina o ranking editorial.",
      sponsoredHeading: "Posições patrocinadas",
      sponsoredBody:
        'Quando aceitamos posições patrocinadas, elas são separadas visualmente do conteúdo editorial e etiquetadas como "Patrocinado". Uma posição patrocinada nunca é apresentada como, nem misturada a, um ranking editorial.',
      identifyingHeading: "Como identificar links de afiliados",
      identifyingBody:
        "Páginas que contêm links de afiliados trazem uma divulgação próxima às recomendações relevantes. Se você tiver dúvidas sobre um link ou programa específico, o comerciante e o nome do programa fazem parte de nossos registros internos e podem ser solicitados por meio de nossos dados de contato assim que publicados.",
    },
    privacy: {
      metaTitle: "Política de privacidade",
      metaDescription:
        "O que a {brand} coleta, por quê, e como é protegido — um rascunho de trabalho antes do lançamento público.",
      title: "Política de privacidade",
      lastUpdated: "agosto de 2026",
      draftNotice:
        "Este é um rascunho de trabalho de nossas práticas de privacidade, publicado antes do lançamento público. Será revisado por assessoria jurídica e finalizado — incluindo requisitos de consentimento específicos de cada jurisdição — antes que a {brand} aceite contas de usuário reais ou veiculação de anúncios em escala.",
      collectHeading: "O que coletamos",
      collectBody:
        "Se você criar uma conta, coletamos seu e-mail, um nome de exibição que você escolher e as preferências que definir (como inscrição na newsletter e idioma). Se você enviar um formulário de lead a um fornecedor, coletamos o que esse formulário pedir e o repassamos ao fornecedor correspondente, conforme informado no próprio formulário.",
      minimizationHeading: "Minimização de dados",
      minimizationBody:
        "Coletamos o que uma funcionalidade precisa e nada mais. Dados pessoais são protegidos por regras de acesso no nível do banco de dados — não apenas restrições de interface — para que só os sistemas e papéis que precisam possam lê-los.",
      cookiesHeading: "Cookies e análise",
      cookiesBody:
        "Usamos identificadores de sessão para medir quais páginas e recomendações têm melhor desempenho, e para atribuir cliques de afiliados e conversões com precisão. Não vendemos dados pessoais a terceiros.",
      choicesHeading: "Suas escolhas",
      choicesBody:
        "Quando as contas estiverem ativas, você poderá ver, exportar e excluir os dados da sua conta nas suas preferências. Até lá, esta página descreve uma intenção, não um fluxo de autoatendimento em funcionamento.",
    },
    terms: {
      metaTitle: "Termos de serviço",
      metaDescription:
        "Os termos que regem o uso da {brand} — um rascunho de trabalho antes do lançamento público.",
      title: "Termos de serviço",
      lastUpdated: "agosto de 2026",
      draftNotice:
        "Este é um rascunho de trabalho publicado antes do lançamento público. Será revisado por assessoria jurídica e finalizado antes que a {brand} opere em escala.",
      useHeading: "Uso deste site",
      useBody:
        "A {brand} oferece comparativos, guias de compra e ferramentas para ajudar você a avaliar produtos e serviços. O conteúdo é informativo — não garantimos que qualquer produto atenda à sua necessidade específica, e o preço ou disponibilidade mostrados aqui podem mudar após a data da última revisão daquela página.",
      accountsHeading: "Contas",
      accountsBody:
        "Quando a criação de contas estiver ativa, você será responsável pela precisão das informações fornecidas e por manter suas credenciais seguras.",
      affiliateHeading: "Conteúdo de afiliados e patrocinado",
      affiliateBodyPrefix:
        "Alguns links neste site são links de afiliados, e algumas posições são patrocinadas. Ambos são divulgados — veja nossa",
      affiliateLinkLabel: "Divulgação de afiliados",
      affiliateBodySuffix: ". Usar esses links não muda o preço que você paga.",
      liabilityHeading: "Limitação de responsabilidade",
      liabilityBody:
        "Esta seção será finalizada com assessoria jurídica antes do lançamento para refletir as jurisdições em que operamos.",
    },
  },
  niches: {
    "business-software-ai": {
      name: "Software Empresarial e IA",
      shortName: "Software e IA",
      description:
        "CRM, assistentes de IA, automação, software de SEO e marketing, site e e-commerce, e produtividade — comparativos feitos para PMEs, agências e equipes comerciais.",
      categories: [
        "CRM",
        "Assistentes de IA",
        "Automação",
        "SEO e marketing",
        "Site e e-commerce",
        "Produtividade",
      ],
    },
    "travel-smart-travel": {
      name: "Viagens e Travel Tech",
      shortName: "Viagens",
      description:
        "Hotéis, destinos, roteiros, eSIM e conectividade, bagagem e travel tech — decisões de viagem respaldadas por evidências, não só opinião.",
      categories: [
        "Hotéis",
        "Destinos",
        "Roteiros",
        "eSIM e conectividade",
        "Bagagem",
        "Travel tech",
      ],
    },
    "consumer-tech-smart-home": {
      name: "Tecnologia de Consumo e Casa Inteligente",
      shortName: "Tecnologia",
      description:
        "Casa inteligente, redes, áudio, monitores, acessórios e home office — o que comprar, comparado com especificações verificadas.",
      categories: [
        "Casa inteligente",
        "Redes",
        "Áudio",
        "Monitores",
        "Acessórios",
        "Home office",
      ],
    },
  },
  catalog: {
    startingAt: "A partir de",
    perMonth: "/mês",
    perYear: "/ano",
    visitWebsite: "Visitar site",
    viewDetails: "Ver detalhes",
    backToCategory: "← Voltar para {category}",
    sourceLabel: "Fonte",
    lastCheckedLabel: "Última verificação",
    noProductsYet: "Ainda não há produtos publicados nesta categoria.",
    featuresHeading: "Características",
    pricingHeading: "Preços",
    methodologyNote: "Preços e características são citados com uma fonte e uma data de verificação — veja nossa metodologia.",
  },
  tools: {
    crmComparatorTitle: "Comparador de preços de CRM",
    crmComparatorIntro: "Selecione os CRMs que você está avaliando para comparar o preço do plano de entrada e a disponibilidade de plano gratuito, lado a lado.",
    selectToCompare: "Selecionar para comparar",
    entryPlanColumn: "Plano de entrada",
    priceColumn: "Preço inicial",
    freeTierColumn: "Plano gratuito",
    noSelection: "Selecione pelo menos um CRM acima para ver uma comparação.",
    esimComparatorTitle: "Comparador de planos eSIM",
    esimComparatorIntro: "Selecione os provedores de eSIM que você está avaliando para comparar preço de entrada, modelo de dados e cobertura lado a lado.",
    dataModelColumn: "Modelo de dados",
    largestPlanColumn: "Maior plano",
    coverageColumn: "Cobertura",
  },
};
