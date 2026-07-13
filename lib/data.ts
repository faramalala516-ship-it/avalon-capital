import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  CalendarDays,
  Gem,
  Globe2,
  Landmark,
  LineChart,
  MessageSquareText,
  Newspaper,
  ShieldCheck,
  Target,
  UserCog,
  WalletCards
} from "lucide-react";

export const navPages = [
  { href: "/dashboard", title: "Dashboard", icon: Activity },
  { href: "/market-intelligence", title: "Sentiment de marche", icon: Globe2 },
  { href: "/macro-dashboard", title: "Politique monetaire", icon: Landmark },
  { href: "/chatbot-ia", title: "Chatbot IA", icon: MessageSquareText },
  { href: "/trading-scanner", title: "Trading Scanner", icon: BarChart3 },
  { href: "/portefeuille-ia", title: "Portefeuille IA", icon: WalletCards },
  { href: "/tarifs", title: "Abonnements", icon: BadgeDollarSign },
  { href: "/presentation", title: "Presentation", icon: ShieldCheck },
  { href: "/weekly-research", title: "Weekly Research", icon: BookOpen },
  { href: "/calendrier-economique", title: "Calendrier economique", icon: CalendarDays },
  { href: "/news", title: "News", icon: Newspaper },
  { href: "/gem-investment", title: "Gem Investment", icon: Gem },
  { href: "/formation", title: "Formation", icon: BookOpen },
  { href: "/profil", title: "Profil", icon: UserCog },
  { href: "/administration", title: "Administration", icon: UserCog }
];

export const marketSeries = [
  { name: "Jan", nasdaq: 16120, cac: 7470, gold: 5318, btc: 42800, sentiment: 48, liquidity: 51 },
  { name: "Fev", nasdaq: 16890, cac: 7584, gold: 4870, btc: 51100, sentiment: 55, liquidity: 58 },
  { name: "Mar", nasdaq: 18140, cac: 8120, gold: 4550, btc: 68400, sentiment: 68, liquidity: 63 },
  { name: "Avr", nasdaq: 17490, cac: 7924, gold: 4380, btc: 62300, sentiment: 61, liquidity: 55 },
  { name: "Mai", nasdaq: 18630, cac: 7992, gold: 4260, btc: 67500, sentiment: 72, liquidity: 66 },
  { name: "Jun", nasdaq: 19420, cac: 7640, gold: 4130, btc: 64200, sentiment: 64, liquidity: 62 },
  { name: "Jul", nasdaq: 19610, cac: 7710, gold: 4120, btc: 66100, sentiment: 62, liquidity: 60 }
];

export const macroIndicators = [
  { label: "Inflation US", value: "3.1%", change: "-0.2", tone: "positive" },
  { label: "PMI Global", value: "51.8", change: "+1.4", tone: "positive" },
  { label: "Fed Funds", value: "5.25%", change: "pause", tone: "neutral" },
  { label: "VIX", value: "14.7", change: "-8.2%", tone: "positive" },
  { label: "Dollar Index", value: "104.2", change: "+0.5%", tone: "negative" },
  { label: "Brent", value: "$82.4", change: "+1.1%", tone: "neutral" }
];

export const signals = [
  {
    asset: "Nasdaq 100",
    direction: "Long selectif",
    setup: "ICT liquidity sweep + reclaim VWAP",
    probability: 0.68,
    support: "18 940",
    resistance: "19 420",
    timeframe: "H4",
    entry: "19 080 - 19 140",
    takeProfit: "19 720",
    stopLoss: "18 760",
    horizon: "Swing 3-8 jours",
    rr: "1:2.1",
    confidence: "Elevee",
    justification: "Momentum IA resilient, flux ETF positifs, breadth tech en amelioration.",
    catalysts: "CPI US, earnings mega-cap, discours Fed",
    sentimentBias: "Risk-on controle",
    scenarioRisk: "Hausse rapide des taux reels ou prise de profit sur semiconducteurs."
  },
  {
    asset: "XAUUSD",
    direction: "Long defensif",
    setup: "Repli controle pres du support court terme, or encore sensible au dollar et aux taux reels",
    probability: 0.63,
    support: "4 070",
    resistance: "4 135",
    timeframe: "D1",
    entry: "4 085 - 4 115",
    takeProfit: "4 210",
    stopLoss: "4 035",
    horizon: "Swing 1-3 semaines",
    rr: "1:1.8",
    confidence: "Moyenne haute",
    justification: "Spot or proche de 4 120 USD/oz; achats banques centrales, protection inflation et convexite geopolitical hedge restent porteurs.",
    catalysts: "Taux reels US, dollar index, adjudications US Treasury",
    sentimentBias: "Hedge macro",
    scenarioRisk: "Cassure de 4 070 puis 4 000 si dollar breakout ou remontee rapide des taux reels."
  },
  {
    asset: "EURUSD",
    direction: "Range opportuniste",
    setup: "Fair Value Gap M30, dollar fatigue",
    probability: 0.57,
    support: "1.0790",
    resistance: "1.0940",
    timeframe: "H1",
    entry: "1.0835 - 1.0850",
    takeProfit: "1.0940",
    stopLoss: "1.0770",
    horizon: "Daily trade",
    rr: "1:1.7",
    confidence: "Moderee",
    justification: "Positionnement dollar deja charge et surprise BCE partiellement pricee.",
    catalysts: "PMI zone euro, minutes Fed, inflation core",
    sentimentBias: "Dollar fatigue",
    scenarioRisk: "Repricing hawkish Fed ou stress politique Europe."
  }
];

export const aiAgents = [
  {
    id: "macro-policy",
    name: "Macro Policy Agent",
    role: "Interprete inflation, croissance, emploi, taux reels et reaction des banques centrales.",
    inputs: "CPI, NFP, PMI, courbes de taux, speeches, dot plots",
    method: "Compare donnees publiees, attentes du marche et fonction de reaction historique.",
    output: "Scenario hawkish/dovish, actifs sensibles, trades a surveiller",
    authority: "Analyse strategique, pas execution automatique",
    examples: [
      "Resume l'impact d'une surprise CPI sur EURUSD",
      "Compare Fed, BCE et BOJ pour les flux cross-asset",
      "Quel regime macro domine cette semaine ?"
    ],
    icon: Landmark
  },
  {
    id: "macro-x",
    name: "Macro-X Intelligence",
    role: "Agent top-down specialise en cycles macro, liquidite globale et allocation cross-asset.",
    inputs: "PIB, inflation, emploi, PMI, M2, QE/QT, courbes de taux, DXY, credit spreads",
    method: "Diagnostique le cycle, croise hard data et soft data, puis produit plusieurs scenarios probabilises.",
    output: "Rapport Macro-X avec cycle, banques centrales, hard/soft data, geopolitique et allocation",
    authority: "Recherche macro strategique",
    examples: [
      "Fais un rapport Macro-X complet sur les marches globaux",
      "Quel regime macro favorise Nasdaq, or et dollar ?",
      "Propose une allocation top-down avec scenarios recession/soft landing"
    ],
    icon: BrainCircuit
  },
  {
    id: "sentiment",
    name: "Market Sentiment Agent",
    role: "Mesure risk-on/risk-off, breadth, volatilite et conviction des investisseurs.",
    inputs: "VIX, skew, options, ETF flows, futures positioning, social/news tone",
    method: "Score composite normalise avec detection de regime et divergences.",
    output: "Score de sentiment, rotation sectorielle, alertes de retournement",
    authority: "Signal analytique prioritaire",
    examples: [
      "Detecte le sentiment global risk-on/risk-off",
      "Analyse les flux institutionnels sur actions et or",
      "Repere les divergences sentiment/prix"
    ],
    icon: Globe2
  },
  {
    id: "gem-trading-x",
    name: "GEM-Trading Intelligence X",
    role: "Agent trading operationnel qui croise macro, fondamental, sentiment, technique et gestion du risque.",
    inputs: "Actif, ticker, timeframe, niveaux, flux, COT/options, volatilite, catalyseurs macro",
    method: "Produit une analyse multi-timeframe, pondere les facteurs favorables/defavorables et structure un plan.",
    output: "Synthese executive, scenarios probabilistes, entree, stop-loss, TP1/TP2/TP3 et money management",
    authority: "Plan de trading a valider",
    examples: [
      "Analyse XAUUSD en GEM-Trading avec entree, SL, TP1/TP2/TP3",
      "Fais un plan de trading sur Nasdaq pour H1 et daily",
      "Compare le scenario principal et deux alternatives sur EURUSD"
    ],
    icon: Target
  },
  {
    id: "swing",
    name: "Swing Trade Strategist",
    role: "Produit des idees de trades structurees sur 3 jours a 3 semaines.",
    inputs: "Structure prix, liquidite, catalyseurs macro, volatilite implicite",
    method: "Filtre momentum, asymetrie risque/rendement et calendrier evenementiel.",
    output: "Entree, stop loss, take profit, ratio R/R, scenario alternatif",
    authority: "Idee de trade a valider par l'utilisateur",
    examples: [
      "Propose une idee swing trade structuree sur XAUUSD",
      "Cherche une asymetrie long/short sur Nasdaq",
      "Donne un plan swing avec invalidation claire"
    ],
    icon: Target
  },
  {
    id: "daily",
    name: "Daily Trade Analyst",
    role: "Detecte les niveaux intraday et les evenements qui modifient la session.",
    inputs: "VWAP, open range, volume profile, news tape, volatilite",
    method: "Regroupe microstructure, momentum et contexte macro de la journee.",
    output: "Plan daily, niveaux d'invalidation, horaires sensibles",
    authority: "Assistance tactique",
    icon: BarChart3
  },
  {
    id: "cross-asset",
    name: "Cross-Asset Flow Analyst",
    role: "Relie devises, obligations, indices, matieres premieres et crypto.",
    inputs: "DXY, yields, credit spreads, commodities, correlations",
    method: "Cartographie les flux de capitaux et changements de correlation.",
    output: "Carte de regime, actifs leaders, risques de contagion",
    authority: "Analyse de portefeuille",
    icon: LineChart
  },
  {
    id: "risk",
    name: "Risk Management Agent",
    role: "Controle exposition, drawdown, concentration et discipline de stops.",
    inputs: "Portefeuille, VaR, beta, volatilite, correlation, historique trades",
    method: "Stress tests multi-scenarios et limites de perte par idee.",
    output: "Taille indicative, exposition nette, alertes de risque",
    authority: "Garde-fou obligatoire",
    icon: ShieldCheck
  },
  {
    id: "portfolio",
    name: "Portfolio Allocation Agent",
    role: "Adapte allocation et watchlists au profil de risque de l'utilisateur.",
    inputs: "Profil, horizon, liquidite, performances, contraintes personnelles",
    method: "Allocation par regimes avec limites d'exposition et rebalancing.",
    output: "Allocation cible, actions prioritaires, suivi de performance",
    authority: "Aide a la decision",
    icon: WalletCards
  },
  {
    id: "gemini",
    name: "Gemini/Gems Orchestrator",
    role: "Route les demandes vers des Gems specialises selon l'intention utilisateur.",
    inputs: "Question, actif, horizon, style, historique d'analyses",
    method: "Selection d'agent, instruction specialisee, synthese structuree.",
    output: "Reponse personnalisee par role avec niveau de confiance",
    authority: "Orchestration conversationnelle",
    icon: Bot
  }
];

export const agentValidationProtocol = [
  "Aucune donnee de marche, macro, flux ou news n'est inventee.",
  "Chaque chiffre est classe: fourni, contexte Avalon, hypothese ou non fourni.",
  "Toute analyse doit exposer donnees manquantes, hypotheses et invalidation.",
  "Un biais doit etre confirme par au moins deux piliers: macro, technique, flux/sentiment ou risque.",
  "Les sorties restent une aide a la decision, jamais une instruction d'execution."
];

export const sentimentIndicators = [
  { label: "Global sentiment", value: "64/100", detail: "Risk-on modere", tone: "positive", width: 64 },
  { label: "Institutional flows", value: "+$18.4B", detail: "ETF equity inflows", tone: "positive", width: 72 },
  { label: "Volatility stress", value: "23/100", detail: "VIX bas mais skew ferme", tone: "neutral", width: 23 },
  { label: "Investor conviction", value: "58/100", detail: "Conviction selective", tone: "neutral", width: 58 },
  { label: "Safe-haven demand", value: "41/100", detail: "Or soutenu", tone: "neutral", width: 41 },
  { label: "Liquidity impulse", value: "62/100", detail: "Dollar liquidity stable", tone: "positive", width: 62 }
];

export const sectorFlows = [
  { sector: "AI infrastructure", flow: "+2.8%", tone: "positive" },
  { sector: "Semiconductors", flow: "+2.1%", tone: "positive" },
  { sector: "Defensive healthcare", flow: "+0.7%", tone: "neutral" },
  { sector: "Banks Europe", flow: "-0.4%", tone: "neutral" },
  { sector: "Small caps", flow: "-1.2%", tone: "negative" },
  { sector: "Energy cyclicals", flow: "-1.8%", tone: "negative" }
];

export const centralBanks = [
  {
    bank: "Federal Reserve",
    rate: "5.25%",
    next: "31 Jul 2026",
    tone: "Hawkish pause",
    marketPricing: "38 bps cuts / 12 mois",
    surprise: "Inflation services persistante",
    impacts: ["USD soutenu", "Nasdaq sensible aux taux reels", "Or dependant du DXY"]
  },
  {
    bank: "European Central Bank",
    rate: "3.75%",
    next: "06 Aug 2026",
    tone: "Dovish selective",
    marketPricing: "52 bps cuts / 12 mois",
    surprise: "PMI faibles, salaires a surveiller",
    impacts: ["EUR sous pression", "Duration Europe favorisee", "CAC range"]
  },
  {
    bank: "Bank of England",
    rate: "4.75%",
    next: "13 Aug 2026",
    tone: "Data dependent",
    marketPricing: "44 bps cuts / 12 mois",
    surprise: "Inflation domestique collante",
    impacts: ["GBP volatil", "FTSE value resilient", "Gilt curve instable"]
  },
  {
    bank: "Bank of Japan",
    rate: "0.50%",
    next: "30 Jul 2026",
    tone: "Gradual normalization",
    marketPricing: "1 hike possible",
    surprise: "Yen intervention risk",
    impacts: ["JPY asymetrique", "Carry trades vulnerables", "Global risk-off tail"]
  }
];

export const pricingPlans = [
  {
    name: "Essential Intelligence",
    monthly: "149 EUR/mois",
    annual: "1 490 EUR/an",
    tagline: "Pour suivre les regimes de marche et les signaux principaux.",
    analyses: "15 analyses/jour",
    agents: "3 agents IA",
    depth: "Sentiment global, weekly research, signaux limites",
    support: "Support standard",
    features: [
      "Dashboard sentiment global",
      "Watchlist multi-assets",
      "3 idees de trades par semaine",
      "Historique 30 jours",
      "Alertes de marche essentielles"
    ]
  },
  {
    name: "Premium Gold",
    monthly: "399 EUR/mois",
    annual: "3 990 EUR/an",
    tagline: "Le plan central pour investisseurs actifs et desks independants.",
    analyses: "80 analyses/jour",
    agents: "6 agents IA",
    depth: "Macro, micro, banques centrales, flux, alertes avancees",
    support: "Support prioritaire",
    highlighted: true,
    features: [
      "Pages sentiment et politique monetaire completes",
      "Signaux swing et daily enrichis",
      "Journal d'analyses IA",
      "Alertes macro et volatilite",
      "Exports CSV/PDF mensuels"
    ]
  },
  {
    name: "Elite Full AI",
    monthly: "990 EUR/mois",
    annual: "9 900 EUR/an",
    tagline: "Acces complet aux agents Pro, Gems Gemini et scenarios avances.",
    analyses: "Illimite raisonnable",
    agents: "Tous agents + Gems",
    depth: "Portefeuille, personnalisation, stress tests, exports premium",
    support: "Concierge institutionnel",
    features: [
      "Chatbot multi-agent avance",
      "Gems personnalises par role",
      "Allocation et risque par profil",
      "Scenario lab cross-asset",
      "Onboarding prioritaire"
    ]
  }
];

export const complianceItems = [
  "Contenu a visee informationnelle et d'aide a la decision.",
  "Aucune promesse de performance et aucun gain garanti.",
  "Chaque idee de trade conserve entree, invalidation, scenario alternatif et trace IA.",
  "Gestion des roles utilisateur, journal d'audit et permissions par abonnement.",
  "Les signaux distinguent analyse, idee, simulation, suivi et gestion du risque."
];

export const memberModules = [
  "Profil investisseur",
  "Carnet d'ordres simule",
  "Trades suggeres par IA",
  "Historique des analyses",
  "Performance et P/L",
  "Suivi VaR et drawdown",
  "Alertes intelligentes",
  "Preferences d'investissement"
];

export const gems = [
  {
    name: "Diamant bleu fancy vivid",
    type: "Diamant",
    origin: "Cullinan, Afrique du Sud",
    carat: "3.21 ct",
    certification: "GIA",
    rarity: 97,
    aiRating: "A+",
    history: "Couleur naturelle, provenance documentee, liquidite elevee en ventes privees.",
    valueCurve: [84, 88, 91, 95, 101, 109],
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Rubis pigeon blood",
    type: "Rubis",
    origin: "Mogok, Myanmar",
    carat: "5.04 ct",
    certification: "SSEF",
    rarity: 94,
    aiRating: "A",
    history: "Sans traitement thermique, profondeur chromatique rare, demande asiatique soutenue.",
    valueCurve: [72, 77, 83, 88, 97, 104],
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Saphir royal blue",
    type: "Saphir",
    origin: "Kashmir",
    carat: "7.18 ct",
    certification: "Gubelin",
    rarity: 96,
    aiRating: "A+",
    history: "Velours visuel typique Kashmir, faible disponibilite, historique de prix robuste.",
    valueCurve: [80, 83, 89, 96, 103, 112],
    image:
      "https://images.unsplash.com/photo-1615655096345-61a54750068d?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Emeraude no-oil",
    type: "Emeraude",
    origin: "Muzo, Colombie",
    carat: "4.62 ct",
    certification: "GRS",
    rarity: 93,
    aiRating: "A",
    history: "Purete rare sans huile, couleur intense, offre institutionnelle tres limitee.",
    valueCurve: [68, 73, 81, 86, 91, 99],
    image:
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Alexandrite changement fort",
    type: "Alexandrite",
    origin: "Oural, Russie",
    carat: "2.11 ct",
    certification: "Gubelin",
    rarity: 98,
    aiRating: "A+",
    history: "Changement chromatique marque, origine historique, rarete structurelle exceptionnelle.",
    valueCurve: [91, 94, 99, 108, 117, 126],
    image:
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Spinelle rouge naturel",
    type: "Spinelle",
    origin: "Mahenge, Tanzanie",
    carat: "6.40 ct",
    certification: "SSEF",
    rarity: 89,
    aiRating: "A-",
    history: "Segment encore sous-institutionnalise, forte asymetrie si certification top-tier.",
    valueCurve: [52, 58, 66, 74, 82, 93],
    image:
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Tanzanite AAA",
    type: "Tanzanite",
    origin: "Merelani, Tanzanie",
    carat: "12.80 ct",
    certification: "IGI",
    rarity: 86,
    aiRating: "B+",
    history: "Gisement concentre geographiquement, valeur sensible a la qualite de taille et saturation.",
    valueCurve: [44, 47, 51, 59, 65, 71],
    image:
      "https://images.unsplash.com/photo-1608042314453-ae338d80c427?auto=format&fit=crop&w=900&q=80"
  }
];

export const reports = [
  {
    title: "Regime macro: croissance lente, liquidite selective",
    date: "2026-07-03",
    pages: 42,
    summary: "Allocation barbell entre qualite US, duration courte et or."
  },
  {
    title: "AI infrastructure: capex, marges et concentration",
    date: "2026-06-26",
    pages: 35,
    summary: "Stress test des multiples Nasdaq et opportunites semi-conducteurs."
  },
  {
    title: "Gemstones as real asset diversifier",
    date: "2026-06-19",
    pages: 29,
    summary: "Prime de rarete, certifications et courbes de valeur."
  }
];
