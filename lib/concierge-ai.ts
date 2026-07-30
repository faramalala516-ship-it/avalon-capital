const knowledge = {
  minerals: [
    "tourmaline",
    "indicolite",
    "lépidolite",
    "lepidolite",
    "mica",
    "chromite",
    "amazonite",
    "felspath",
    "muscovite",
    "silice",
    "quartz",
    "saphir",
    "sapphire",
    "grenat",
    "grossulaire",
    "démantoïde",
    "demantoide",
    "béryl",
    "beryl",
    "aigue-marine",
    "aquamarine",
    "ilménite",
    "hématite",
    "rutile",
    "inclusion"
  ],
  photo: [
    "macro",
    "polarisation",
    "focus stacking",
    "éclairage",
    "tirage",
    "exposition",
    "format",
    "tableau",
    "fine art",
    "dpi"
  ],
  commerce: ["enchère", "abonnement", "virement", "badge", "certificat", "blockchain", "qr"]
};

function detectTopic(question: string) {
  const q = question.toLowerCase();
  if (knowledge.commerce.some((k) => q.includes(k))) return "commerce" as const;
  if (knowledge.photo.some((k) => q.includes(k))) return "photo" as const;
  if (knowledge.minerals.some((k) => q.includes(k))) return "mineral" as const;
  if (q.includes("madagascar") || q.includes("ilakaka") || q.includes("localité")) return "origin" as const;
  if (q.includes("vpn") || q.includes("europe") || q.includes("international")) return "reach" as const;
  return "general" as const;
}

export function buildConciergeReply(question: string) {
  const topic = detectTopic(question);

  const intros = {
    mineral:
      "En tant que concierge gemmologue de Gem'StonEye'Shootin'Gallery, je relie la variété minérale à sa mise en lumière photographique.",
    photo:
      "Du côté photographie de studio minéral : chaque cliché est pensé pour l'édition, l'exposition et le tirage Fine Art.",
    commerce:
      "Pour l'acquisition : formats licenciés, virement bancaire international, certificat blockchain et QR d'appartenance.",
    origin:
      "Nos sujets viennent principalement de Madagascar — Ilakaka, Sahatany, Mananjary et pegmatites du sud.",
    reach:
      "La galerie opère depuis l'Europe avec une présence internationale : le parcours d'achat s'adapte aux visiteurs via le concierge (langues, formats, horaires d'enchères) pour toucher collectionneurs, foires et rédactions.",
    general:
      "Je suis le concierge-gallériste de Gem'StonEye'Shootin'Gallery — gemmologie, photographie et orientation dans la collection du mois."
  };

  const bodies: Record<typeof topic, string> = {
    mineral: `Pour « ${question.trim()} » : observez la couleur, le lustre et les inclusions. Dans la galerie, les meilleures collections du mois mettent en avant des spécimens photographiés prêts à la vente — description, prix et formats sous chaque cliché. Demandez-moi un mineral précis pour une recommandation de format (éditorial, expo, tableau).`,
    photo: `Concernant « ${question.trim()} » : nos masters sont calibrés 300 dpi. Choisissez Éditorial A4 pour magazines, Exposition grand format pour foires, Tableau Fine Art pour impression pigmentaire, Double page livre pour monographies. Les aperçus web portent un filigrane et un blocage de capture d'écran ; le fichier master n'est délivré qu'après paiement confirmé.`,
    commerce: `Au sujet de « ${question.trim()} » : paiement par carte Visa/Mastercard ou virement SEPA/SWIFT compte à compte. Après crédit, génération du certificat GSES-Ledger (empreinte SHA-256) et QR d'appartenance. L'abonnement Salon Privé (49 €/mois) ouvre la salle des enchères et les avant-premières mensuelles. Les badges récompensent vos acquisitions.`,
    origin: `À propos de « ${question.trim()} » : le podium du mois met en avant 1) un saphir aux inclusions fantasmagoriques (rutile carboneux alumineux), 2) un grenat grossulaire diamantoïde au métamorphisme progressif, 3) un béryl bleu / aigue-marine à ilménite, hématite et œil de chat électrisant — plus les archives indicolite / amazonite.`,
    reach: `Pour « ${question.trim()} » : le site est conçu pour l'Europe et au-delà. Le concierge guide chaque visiteur vers la collection du mois, les archives, l'espace personnel et — pour les abonnés — la salle privée. Aucun téléchargement libre : filigrane, anti-capture d'écran, et traçabilité blockchain à la vente.`,
    general: `Vous avez demandé : « ${question.trim()} ». Je peux vous orienter vers la collection du mois, expliquer un mineral, conseiller un format d'image, détailler le virement international, ou préparer votre entrée au Salon Privé. Que souhaitez-vous explorer ?`
  };

  return `${intros[topic]}

${bodies[topic]}

— Concierge Gem'StonEye · savoir gemmologique & photographique`;
}

export const CONCIERGE_SYSTEM_PROMPT = `Tu es le concierge-gallériste professionnel de Gem'StonEye'Shootin'Gallery
(domaine: www.gemstoneyeshootingallery.com).

Expertise:
- Gemmologie (minerais et gemmes de Madagascar)
- Photographie de studio minéral, tirages, licences d'image
- Accompagnement d'acheteurs: expositions, foires, livres, magazines, collectionneurs

Règles:
- Réponds en français, ton classe, précis, chaleureux.
- Oriente vers: présentation, galerie mensuelle + archives, espace personnel, salle des enchères (abonnés).
- Formats: Éditorial A4, Exposition grand format, Tableau Fine Art, Double page livre.
- Paiement: virement bancaire international compte à compte (SEPA/SWIFT).
- Protection: filigrane + anti-screenshot/téléchargement sur aperçus; master après paiement.
- Preuve: certificat blockchain GSES-Ledger + QR d'appartenance.
- N'invente pas de prix hors catalogue fourni. Pas de conseil d'investissement.
`;
