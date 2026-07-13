export type MarketAnalysis = {
  asset: string;
  direction: string;
  fundamental: string;
  technical: string;
  macro: string;
  support: string;
  resistance: string;
  entry: string;
  takeProfit: string;
  stopLoss: string;
  horizon: string;
  riskReward: string;
  confidence: string;
  scenarios: Array<{ label: string; probability: number; detail: string }>;
};

const analyses: Record<string, MarketAnalysis> = {
  nasdaq: {
    asset: "Nasdaq 100",
    direction: "Long selectif",
    fundamental: "Qualite beneficiaire elevee, croissance concentree sur IA/cloud, valorisation sensible aux taux reels.",
    technical: "Tendance primaire haussiere, prix au-dessus EMA 50/200, momentum RSI encore constructif mais extension tactique.",
    macro: "Le principal facteur reste la trajectoire Fed et la liquidite dollar. Un VIX bas soutient le carry actions.",
    support: "18 940 / 18 620",
    resistance: "19 420 / 19 850",
    entry: "19 080 - 19 140",
    takeProfit: "19 720",
    stopLoss: "18 760",
    horizon: "Swing 3-8 jours",
    riskReward: "1:2.1",
    confidence: "Elevee",
    scenarios: [
      { label: "Continuation controlee", probability: 0.52, detail: "Reprise au-dessus VWAP hebdomadaire." },
      { label: "Rotation defensive", probability: 0.31, detail: "Prises de profit vers qualite non-tech." },
      { label: "Stress taux reels", probability: 0.17, detail: "Cassure EMA 50 et volatilite en hausse." }
    ]
  },
  cac40: {
    asset: "CAC 40",
    direction: "Range tactique",
    fundamental: "Decote relative europeenne, exposition luxe/industrie et banques avec sensibilite au cycle chinois.",
    technical: "Structure laterale, resistance proche des anciens sommets, support defendu par les flux value.",
    macro: "BCE plus accommodante que la Fed, mais croissance zone euro fragile.",
    support: "7 420 / 7 260",
    resistance: "7 780 / 8 020",
    entry: "7 520 - 7 575",
    takeProfit: "7 780",
    stopLoss: "7 360",
    horizon: "Daily a swing court",
    riskReward: "1:1.6",
    confidence: "Moderee",
    scenarios: [
      { label: "Rattrapage Europe", probability: 0.44, detail: "PMI en amelioration et euro stable." },
      { label: "Range institutionnel", probability: 0.39, detail: "Compression entre banques et luxe." },
      { label: "Risque politique", probability: 0.17, detail: "Elargissement spreads souverains." }
    ]
  },
  eurusd: {
    asset: "EURUSD",
    direction: "Rebond opportuniste",
    fundamental: "Differentiel de croissance favorable dollar, mais positionnement deja charge.",
    technical: "FVG intraday et support 1.0790; un reclaim 1.0880 relancerait 1.0940.",
    macro: "Arbitrage Fed/BCE et surprises inflation dominent.",
    support: "1.0790 / 1.0715",
    resistance: "1.0880 / 1.0940",
    entry: "1.0835 - 1.0850",
    takeProfit: "1.0940",
    stopLoss: "1.0770",
    horizon: "Daily trade",
    riskReward: "1:1.7",
    confidence: "Moderee",
    scenarios: [
      { label: "Rebond technique", probability: 0.46, detail: "Dollar fatigue et couverture shorts EUR." },
      { label: "Range", probability: 0.36, detail: "Attente CPI/FOMC." },
      { label: "Breakdown", probability: 0.18, detail: "Surprise hawkish Fed." }
    ]
  },
  xauusd: {
    asset: "XAUUSD",
    direction: "Long defensif",
    fundamental: "Achats banques centrales, diversification reserves et couverture geopolitiques restent porteurs, avec un spot or proche de 4 120 USD/oz.",
    technical: "Zone de consolidation haute: support court terme proche de 4 070, seuil psychologique majeur a 4 000, resistance proche de 4 135.",
    macro: "Taux reels et dollar dictent le timing. Un dollar fort peut peser, mais la demande structurelle limite les drawdowns.",
    support: "4 070 / 4 000",
    resistance: "4 135 / 4 210",
    entry: "4 085 - 4 115",
    takeProfit: "4 210",
    stopLoss: "4 035",
    horizon: "Swing 1-3 semaines",
    riskReward: "1:1.8",
    confidence: "Moyenne haute",
    scenarios: [
      { label: "Rebond controle", probability: 0.46, detail: "Maintien au-dessus de 4 070 et reprise vers 4 135 / 4 210." },
      { label: "Consolidation", probability: 0.36, detail: "Range 4 070-4 135 avant catalyseur Fed ou dollar." },
      { label: "Flush liquidite", probability: 0.18, detail: "Cassure de 4 070 puis test du seuil 4 000 si dollar et taux reels montent." }
    ]
  },
  btc: {
    asset: "Bitcoin",
    direction: "Breakout conditionnel",
    fundamental: "Adoption institutionnelle soutenue par ETF, offre contrainte et sensibilite liquidite globale.",
    technical: "Structure haussiere volatile, supports de cout moyen court terme a surveiller.",
    macro: "Beta liquidite eleve: dollar, Nasdaq et taux reels restent les variables dominantes.",
    support: "62 300 / 58 800",
    resistance: "68 400 / 72 000",
    entry: "65 200 - 66 100",
    takeProfit: "72 000",
    stopLoss: "61 800",
    horizon: "Swing volatile",
    riskReward: "1:1.8",
    confidence: "Moderee",
    scenarios: [
      { label: "Breakout liquidite", probability: 0.43, detail: "Flux ETF positifs et risk-on." },
      { label: "Compression", probability: 0.35, detail: "Volatilite implicite en baisse." },
      { label: "Deleveraging", probability: 0.22, detail: "Liquidations longues sous support." }
    ]
  }
};

export function buildMarketAnalysis(question: string) {
  const key = Object.keys(analyses).find((item) => question.toLowerCase().includes(item)) ?? "nasdaq";
  const analysis = analyses[key];
  const scenarioText = analysis.scenarios
    .map((scenario) => `- ${scenario.label} (${Math.round(scenario.probability * 100)}%): ${scenario.detail}`)
    .join("\n");

  return `${analysis.asset}

Analyse fondamentale: ${analysis.fundamental}
Analyse technique: ${analysis.technical}
Contexte macro: ${analysis.macro}

Support: ${analysis.support}
Resistance: ${analysis.resistance}

Idee de trade:
- Direction: ${analysis.direction}
- Entree: ${analysis.entry}
- Take profit: ${analysis.takeProfit}
- Stop loss: ${analysis.stopLoss}
- Horizon: ${analysis.horizon}
- Ratio risque/rendement: ${analysis.riskReward}
- Confiance IA: ${analysis.confidence}

Scenarios:
${scenarioText}

## Validation institutionnelle
- Donnees utilisees: contexte Avalon statique et demande utilisateur.
- Donnees non validees en live: prix temps reel, flux institutionnels, options, COT, news recentes et calendrier exact.
- Cross-check logique: le biais n'est retenu que si macro, technique et risque restent coherents.
- Niveau de confiance ajuste par qualite des donnees: ${analysis.confidence}, sous reserve de verification live.
- Audit trail: reponse exploitable comme scenario de travail, pas comme signal institutionnel valide en temps reel.

## Donnees manquantes / hypotheses
- Donnees manquantes: flux live, profondeur de carnet, volatilite implicite, volumes et publications macro les plus recentes.
- Hypothese: les niveaux fournis viennent du contexte demo Avalon et doivent etre recoupes avant toute decision.

## Invalidation et conditions de non-trade
- Invalidation: cassure du stop-loss indique, rupture de correlation macro ou publication majeure contraire.
- Non-trade: aucun trade si le prix est au milieu du range, si le R/R est inferieur a 1:1.5 ou si les donnees live ne confirment pas le setup.`;
}

export function buildAgentAnalysis(question: string, agentId?: string) {
  if (agentId === "macro-x") {
    return buildMacroXAnalysis(question);
  }

  if (agentId === "gem-trading-x") {
    return buildGemTradingXAnalysis(question);
  }

  return buildMarketAnalysis(question);
}

function buildMacroXAnalysis(question: string) {
  return `Macro-X Intelligence

## Macro-X Executive Summary
Regime de reference: croissance lente avec liquidite selective. Le marche reste constructif sur les actifs quality,
mais la dependance aux taux reels et aux banques centrales impose une allocation prudente.

## Cycle economique global
- Phase probable: transition expansion tardive / desinflation incomplete.
- Etats-Unis: croissance plus resiliente que la zone euro.
- Zone euro: activite fragile, sensibilite aux taux et au credit.
- Asie: trajectoire heterogene, Chine encore dependante du soutien fiscal.

## Banques centrales, fiscalite et liquidite
- Fed: pause hawkish, donnees inflation et emploi dominantes.
- BCE: biais plus accommodant, mais prudence sur les salaires.
- BoJ: normalisation graduelle, risque sur carry trades.
- Liquidite: impulse neutre a legerement positive, a surveiller via dollar, repo et credit spreads.

## Hard data / soft data
- Hard data: emploi et consommation restent les arbitres du soft landing.
- Soft data: PMI et confiance a utiliser pour confirmer ou invalider la rotation cyclique.
- Donnees non fournies: chiffres exacts CPI, PCE, NFP, PMI et M2 les plus recents.

## Geopolitique et chocs exogenes
Energie, fret, tensions commerciales et fragmentation du commerce mondial restent des risques de queue.

## Matrice cross-asset
- Actions: preference quality et infrastructure IA si taux reels stables.
- Obligations: duration courte ou intermediaire tant que l'inflation reste incertaine.
- FX: dollar ferme si surprise hawkish Fed.
- Commodities: or utile comme hedge macro; cuivre sensible a la Chine.

## Scenarios probabilistes
- Base case 50%: soft landing imparfait, risk-on selectif.
- Optimiste 25%: desinflation confirmee, baisse des taux anticipee, expansion equity.
- Pessimiste 25%: stress taux reels ou croissance, rotation defensive et hausse volatilite.

## Allocation strategique et hedging
- Surponderer: quality equity, cash remunerateur, or tactique.
- Neutre: credit investment grade, duration courte/intermediaire.
- Sous-ponderer: actifs tres leverages ou small caps sans confirmation credit.
- Hedging: or, cash, reduction beta, stops de portefeuille et diversification devise.

## Validation institutionnelle
- Donnees utilisees: contexte Avalon statique, logique macro top-down et demande utilisateur.
- Donnees non validees en live: CPI/PCE/NFP/PMI les plus recents, M2, repo, credit spreads et communiques de banques centrales.
- Cross-check logique: allocation proposee seulement si cycle, liquidite, courbes de taux et credit restent coherents.
- Confiance: Moderee, car les donnees live ne sont pas fournies dans la requete.
- Audit trail: rapport valable comme cadre de recherche, pas comme allocation institutionnelle executable sans verification externe.

## Donnees manquantes / hypotheses
La demande "${question}" ne fournit pas de donnees temps reel. L'analyse utilise le modele demo Avalon et doit etre
actualisee avec les dernieres publications macro avant decision.

## Invalidation et conditions de non-allocation
- Invalidation: surprise inflation/taux, stress credit, rupture de liquidite dollar ou changement brutal de forward guidance.
- Non-allocation: ne pas transformer ce rapport en allocation si les donnees macro recentes ne sont pas recoupees.

## Note de conformite
Analyse informative et probabiliste. Pas de conseil financier personnalise, pas de promesse de performance.`;
}

function buildGemTradingXAnalysis(question: string) {
  const base = buildMarketAnalysis(question);

  return `GEM-Trading Intelligence X

## GEM-Trading Executive Summary
${base}

## Catalyseurs cles
- Politique monetaire et taux reels.
- Flux institutionnels et volatilite implicite.
- Publication macro a venir: CPI, PMI, emploi ou banques centrales selon l'actif.

## Positionnement institutionnel et sentiment
Donnees COT/options/ETF non fournies dans la demande. Hypothese demo: sentiment constructif mais selectif,
avec exposition a reduire avant evenement macro majeur.

## Analyse technique multi-timeframe
- Hebdo: tendance primaire a respecter avant toute prise de position.
- Daily: valider la structure de marche et les zones de liquidite.
- H4/H1: attendre confirmation momentum, rejet de niveau ou reclaim VWAP.

## Ponderation des facteurs
- Favorables 55%: momentum, liquidite selective, catalyseurs macro potentiels.
- Defavorables 30%: taux reels, dollar, volatilite evenementielle.
- Neutres 15%: absence de donnees live sur flux et options.

## Scenarios probabilistes
- Principal 50%: continuation controlee si le prix confirme la zone d'entree.
- Alternatif 30%: range et absence de signal exploitable.
- Extreme 20%: invalidation par surprise macro ou cassure de support.

## Plan de trading operationnel
- Direction: selon le biais du signal ci-dessus.
- Entree: uniquement sur confirmation de niveau, pas en poursuite impulsive.
- Stop-loss: sous la zone d'invalidation technique.
- TP1/TP2/TP3: prendre profits par paliers, puis laisser courir seulement si volatilite favorable.
- Risque maximum indicatif: 0.25% a 1% du capital par idee selon profil.

## Validation institutionnelle
- Donnees utilisees: contexte Avalon statique, demande utilisateur et niveaux demo.
- Donnees non validees en live: dernier prix tick-by-tick, volumes, flux ETF, COT, options, spread et news.
- Cross-check logique: plan conserve uniquement si macro, structure prix, volatilite et risque confirment le meme biais.
- Confiance: Moderee tant que les donnees live ne sont pas recoupees.
- Audit trail: plan de travail structure, pas recommandation d'execution.

## Gestion du risque et conditions de non-trade
No-trade zone: si le prix reste au milieu du range, si le R/R est inferieur a 1:1.5, ou si une publication majeure
arrive avant confirmation. Toute idee doit etre invalidee si le scenario alternatif prend le dessus.

## Donnees manquantes / hypotheses
La demande "${question}" ne fournit pas toutes les donnees live necessaires. Les niveaux doivent etre verifies
sur un flux de marche a jour avant usage.

## Note de conformite
Analyse d'aide a la decision uniquement. Aucune garantie de resultat et aucune execution automatique.`;
}
