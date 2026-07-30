export type ImageFormat = {
  id: string;
  label: string;
  description: string;
  resolution: string;
  license: string;
  priceMultiplier: number;
};

export type GalleryPhoto = {
  id: string;
  slug: string;
  title: string;
  mineral: string;
  locality: string;
  description: string;
  technicalNote: string;
  priceEur: number;
  imageUrl: string;
  featured: boolean;
  formats: string[];
};

export type MonthlyCollection = {
  id: string;
  monthKey: string;
  label: string;
  theme: string;
  intro: string;
  photos: GalleryPhoto[];
};

export type BadgeDef = {
  id: string;
  label: string;
  threshold: number;
  description: string;
};

export type AuctionLot = {
  id: string;
  photoId: string;
  title: string;
  mineral: string;
  imageUrl: string;
  startingBid: number;
  currentBid: number;
  endsAt: string;
  premiere: boolean;
  bids: number;
};

export const IMAGE_FORMATS: ImageFormat[] = [
  {
    id: "editorial-a4",
    label: "Éditorial A4",
    description: "Tirage numérique haute définition pour magazines et catalogues.",
    resolution: "300 dpi · 2480×3508",
    license: "Licence éditoriale unique",
    priceMultiplier: 1
  },
  {
    id: "expo-grand",
    label: "Exposition grand format",
    description: "Fichier master pour foires, vitrines et stands muséographiques.",
    resolution: "300 dpi · 6000×4000",
    license: "Licence exposition (1 an)",
    priceMultiplier: 1.3
  },
  {
    id: "tableau-fineart",
    label: "Tableau Fine Art",
    description: "Master pour impression pigmentaire sur papier coton ou dibond.",
    resolution: "300 dpi · 8000×5333",
    license: "Licence privée collectionneur",
    priceMultiplier: 1.55
  },
  {
    id: "livre-double",
    label: "Double page livre",
    description: "Composition prête pour ouvrages de gemmologie et monographies.",
    resolution: "300 dpi · 7000×5000",
    license: "Licence ouvrage imprimé",
    priceMultiplier: 1.4
  }
];

export const BADGES: BadgeDef[] = [
  {
    id: "eclat-premier",
    label: "Éclat Premier",
    threshold: 1,
    description: "Premier cliché acquis dans la galerie."
  },
  {
    id: "cabinet-curieux",
    label: "Cabinet Curieux",
    threshold: 3,
    description: "Trois photographies de minerais dans votre collection."
  },
  {
    id: "mecene-gemmologue",
    label: "Mécène Gemmologue",
    threshold: 5,
    description: "Cinq acquisitions — soutien à la photographie minéralogique."
  },
  {
    id: "salon-prive",
    label: "Accès Salon Privé",
    threshold: 0,
    description: "Abonnement actif à la salle des ventes aux enchères."
  }
];

export const BANK_TRANSFER = {
  beneficiary: "Gem'StonEye'Shootin'Gallery SARL",
  iban: "FR76 3000 4000 0100 0000 1234 567",
  bic: "BNPAFRPPXXX",
  bank: "BNP Paribas — Paris Opéra",
  referenceHint: "Indiquez la référence commande GSES-XXXX dans le libellé",
  currency: "EUR",
  note: "Virement SEPA / SWIFT international compte à compte. Les fichiers protégés et le certificat blockchain sont délivrés après confirmation du crédit."
};

export const collections: MonthlyCollection[] = [
  {
    id: "2026-08",
    monthKey: "2026-08",
    label: "Août 2026",
    theme: "Podium des inclusions",
    intro: "Trois places d’honneur : 1) saphir aux inclusions fantasmagoriques (rutile carboneux alumineux) · 2) grenat grossulaire diamantoïde au métamorphisme progressif · 3) béryl bleu / aigue-marine à ilménite, hématite et œil de chat électrisant.",
    photos: [
      {
        id: "saphir-inclusions-fantasmagoriques",
        slug: "saphir-inclusions-fantasmagoriques",
        title: "Saphir aux inclusions fantasmagoriques",
        mineral: "Saphir · Rutile carboneux alumineux",
        locality: "Madagascar",
        description: "Saphir facetté en poire : inclusions fantasmagoriques de rutile carboneux alumineux. Paysage intérieur cosmique, idéal magazines de gemmologie et tableaux Fine Art.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 25,
        imageUrl: "/gallery/saphir-inclusions-fantasmagoriques.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "saphir-nebuleuse-interne",
        slug: "saphir-nebuleuse-interne",
        title: "Saphir nébuleuse interne",
        mineral: "Saphir · Rutile carboneux",
        locality: "Madagascar",
        description: "Nébuleuse de soie et aiguilles de rutile au cœur du saphir. Lecture macro des inclusions « fantasmagoriques ».",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 24,
        imageUrl: "/gallery/saphir-nebuleuse-interne.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "saphir-architecture-interne",
        slug: "saphir-architecture-interne",
        title: "Architecture interne du saphir",
        mineral: "Saphir · Inclusions cristallines",
        locality: "Madagascar",
        description: "Plans géométriques et inclusion rectangulaire suspendue — abstraction minérale pour exposition.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 22,
        imageUrl: "/gallery/saphir-architecture-interne.jpg",
        featured: false,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "saphir-cabochon-iridescent",
        slug: "saphir-cabochon-iridescent",
        title: "Cabochon saphir iridescent",
        mineral: "Saphir · Rutile carboneux alumineux",
        locality: "Madagascar",
        description: "Cabochon sombre aux éclats iridescents — carbone et rutile en constellation.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 23,
        imageUrl: "/gallery/saphir-cabochon-iridescent.jpg",
        featured: false,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "grenat-grossulaire-diamantoide",
        slug: "grenat-grossulaire-diamantoide",
        title: "Grenat grossulaire diamantoïde",
        mineral: "Grenat grossulaire (démantoïde)",
        locality: "Madagascar",
        description: "Cristal dodécaédrique vert lumineux — métamorphisme progressif visible dans les voiles internes. Place d’honneur de la collection.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 25,
        imageUrl: "/gallery/grenat-grossulaire-diamantoide.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "grenat-metamorphisme-progressif",
        slug: "grenat-metamorphisme-progressif",
        title: "Grenat au métamorphisme progressif",
        mineral: "Grenat grossulaire diamantoïde",
        locality: "Madagascar",
        description: "Prisme vert mint, voile diagonal et textures de métamorphisme progressif. Cliché solo pour catalogue de foire.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 22,
        imageUrl: "/gallery/grenat-metamorphisme-progressif.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "grenat-grossulaire-voile",
        slug: "grenat-grossulaire-voile",
        title: "Grossulaire à voile interne",
        mineral: "Grenat grossulaire",
        locality: "Madagascar",
        description: "Association de clarté et de voiles — lecture du métamorphisme dans la gangue optique du grenat.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 18,
        imageUrl: "/gallery/grenat-grossulaire-voile.jpg",
        featured: false,
        formats: ["editorial-a4", "tableau-fineart", "expo-grand"]
      },
      {
        id: "aigue-marine-oeil-de-chat",
        slug: "aigue-marine-oeil-de-chat",
        title: "Aigue-marine œil de chat",
        mineral: "Béryl bleu · Ilménite · Hématite · Carbone",
        locality: "Madagascar",
        description: "Béryl bleu / aigue-marine : inclusions rares d’ilménite et hématite, trace de carbone énigmatique — œil de chat électrisant.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 25,
        imageUrl: "/gallery/aigue-marine-oeil-de-chat.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "beryl-bleu-inclusions-rares",
        slug: "beryl-bleu-inclusions-rares",
        title: "Béryl bleu aux inclusions rares",
        mineral: "Béryl (aigue-marine) · Ilménite · Hématite",
        locality: "Madagascar",
        description: "Teal aquatique et inclusions métalliques rares. Poire facettée pour livres de gemmologie.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 23,
        imageUrl: "/gallery/beryl-bleu-inclusions-rares.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "aigue-marine-eclat-electrique",
        slug: "aigue-marine-eclat-electrique",
        title: "Aigue-marine éclat électrique",
        mineral: "Béryl bleu · Carbone · Hématite",
        locality: "Madagascar",
        description: "Inclusion cyan électrique au cœur du béryl — signature carbone / hématite pour collectionneurs.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 21,
        imageUrl: "/gallery/aigue-marine-eclat-electrique.jpg",
        featured: false,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "beryl-galaxie-interne",
        slug: "beryl-galaxie-interne",
        title: "Béryl galaxie interne",
        mineral: "Béryl · Inclusions iridescentes",
        locality: "Madagascar",
        description: "Cabochon aux paillettes iridescentes — constellation minérale, rendu artistique.",
        technicalNote: "Macro inclusions · rognage stratégique · netteté · fond nacré aquatique",
        priceEur: 19,
        imageUrl: "/gallery/beryl-galaxie-interne.jpg",
        featured: false,
        formats: ["editorial-a4", "tableau-fineart", "expo-grand"]
      }
    ]
  },
  {
    id: "2026-07",
    monthKey: "2026-07",
    label: "Juillet 2026 · archive",
    theme: "Prismes Indicolite",
    intro: "Meilleures prises du mois : tourmaline indicolite et mica lépidolite — clichés solo premium, cadrage stratégique et netteté renforcée.",
    photos: [
      {
        id: "indicolite-prisme-mica",
        slug: "indicolite-prisme-mica",
        title: "Prisme indicolite & mica nacrée",
        mineral: "Tourmaline indicolite · Lépidolite",
        locality: "Madagascar",
        description: "Prismes teal translucides couronnés d’une plaquette de mica nacrée. Lumière rasante, idéale pour catalogue de foire ou tableau Fine Art.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 24,
        imageUrl: "/gallery/indicolite-prisme-mica.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "indicolite-terminaison",
        slug: "indicolite-terminaison",
        title: "Terminaison hexagonale indicolite",
        mineral: "Tourmaline indicolite",
        locality: "Madagascar",
        description: "Cristal vertical à terminaison hexagonale nette, reflets aquatiques et base micacée. Cliché solo premium.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 22,
        imageUrl: "/gallery/indicolite-terminaison.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "indicolite-zonee",
        slug: "indicolite-zonee",
        title: "Tourmaline zonée indigo",
        mineral: "Tourmaline indicolite",
        locality: "Madagascar",
        description: "Prisme solo zoné indigo–vert sur gangue blanche. Contraste fort, composition épurée pour couverture ou expo.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 25,
        imageUrl: "/gallery/indicolite-zonee.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "indicolite-faisceau",
        slug: "indicolite-faisceau",
        title: "Faisceau de prismes teal",
        mineral: "Tourmaline indicolite · Silice",
        locality: "Madagascar",
        description: "Faisceau de prismes indicolite accompagné d’un cristal tabulaire clair. Cadre resserré sur la géométrie.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 20,
        imageUrl: "/gallery/indicolite-faisceau.jpg",
        featured: false,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "indicolite-cluster-profond",
        slug: "indicolite-cluster-profond",
        title: "Cluster indicolite profond",
        mineral: "Tourmaline indicolite · Amazonite",
        locality: "Madagascar",
        description: "Amas dense bleu-vert sur gangue d’amazonite. Lecture gemmologique des inclusions et du lustre.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 18,
        imageUrl: "/gallery/indicolite-cluster-profond.jpg",
        featured: false,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      }
    ]
  },
  {
    id: "2026-06",
    monthKey: "2026-06",
    label: "Juin 2026 · archive",
    theme: "Chromite sur amazonite",
    intro: "Collection d’associations : aiguilles et prismes sur gangue d’amazonite, felspath alcalin, silice et muscovite — beauté pierreuse, tarifs collection.",
    photos: [
      {
        id: "aiguilles-amazonite",
        slug: "aiguilles-amazonite",
        title: "Aiguilles sur amazonite",
        mineral: "Tourmaline · Amazonite · Chromite",
        locality: "Madagascar",
        description: "Aiguilles bleutées dans une gangue feldspathique blanche parsemée de grains de chromite.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 16,
        imageUrl: "/gallery/aiguilles-amazonite.jpg",
        featured: true,
        formats: ["editorial-a4", "tableau-fineart", "expo-grand"]
      },
      {
        id: "prismes-matrice-claire",
        slug: "prismes-matrice-claire",
        title: "Prismes dans matrice claire",
        mineral: "Tourmaline · Felspath alcalin · Muscovite",
        locality: "Madagascar",
        description: "Contraste pierreux noir/blanc : prismes sombres dans silice et muscovite.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 14,
        imageUrl: "/gallery/prismes-matrice-claire.jpg",
        featured: false,
        formats: ["editorial-a4", "tableau-fineart", "expo-grand"]
      },
      {
        id: "nid-tourmaline-blanche",
        slug: "nid-tourmaline-blanche",
        title: "Nid de tourmaline blanche",
        mineral: "Tourmaline · Amazonite · Chromite",
        locality: "Madagascar",
        description: "Crevasse cristalline — nid de prismes dans amazonite claire, accents de chromite.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 13,
        imageUrl: "/gallery/nid-tourmaline-blanche.jpg",
        featured: false,
        formats: ["editorial-a4", "tableau-fineart", "expo-grand"]
      },
      {
        id: "crevasse-amazonite",
        slug: "crevasse-amazonite",
        title: "Crevasse d'amazonite",
        mineral: "Tourmaline · Amazonite · Silice",
        locality: "Madagascar",
        description: "Aiguilles sombres logées dans une faille de gangue claire. Texture stony pure.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 12,
        imageUrl: "/gallery/crevasse-amazonite.jpg",
        featured: false,
        formats: ["editorial-a4", "tableau-fineart", "expo-grand"]
      },
      {
        id: "lepidolite-rose-mica",
        slug: "lepidolite-rose-mica",
        title: "Rose de mica & lépidolite",
        mineral: "Lépidolite · Muscovite · Tourmaline",
        locality: "Madagascar",
        description: "Agrégats nacrés de mica lépidolite avec prismes tourmaline et grains sombres.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 15,
        imageUrl: "/gallery/lepidolite-rose-mica.jpg",
        featured: false,
        formats: ["editorial-a4", "tableau-fineart", "expo-grand"]
      }
    ]
  },
  {
    id: "2026-05",
    monthKey: "2026-05",
    label: "Mai 2026 · archive",
    theme: "Silice & associations",
    intro: "Pointes de silice, cristaux à inclusions et aiguilles teal — petites collections d’associations minérales prêtes à l’édition.",
    photos: [
      {
        id: "pointe-silice-tourmaline",
        slug: "pointe-silice-tourmaline",
        title: "Pointe de silice & tourmaline",
        mineral: "Quartz · Tourmaline indicolite · Chromite",
        locality: "Madagascar",
        description: "Pointe hexagonale de silice sur lit d’aiguilles indicolite. Association complète.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 21,
        imageUrl: "/gallery/pointe-silice-tourmaline.jpg",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "cristal-inclusions",
        slug: "cristal-inclusions",
        title: "Cristal à inclusions",
        mineral: "Quartz · Tourmaline · Mica",
        locality: "Madagascar",
        description: "Cristal transparent à inclusions, aiguilles teal et mica sur gangue alcaline.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 19,
        imageUrl: "/gallery/cristal-inclusions.jpg",
        featured: false,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "silice-aiguilles-teal",
        slug: "silice-aiguilles-teal",
        title: "Silice & aiguilles teal",
        mineral: "Quartz · Tourmaline indicolite",
        locality: "Madagascar",
        description: "Silice claire et aiguilles teal — association aquatique, rendu pierreux.",
        technicalNote: "Macro · rognage stratégique · netteté & contraste · fond nacré aquatique",
        priceEur: 17,
        imageUrl: "/gallery/silice-aiguilles-teal.jpg",
        featured: false,
        formats: ["editorial-a4", "tableau-fineart", "expo-grand"]
      }
    ]
  }
];

export const auctionLots: AuctionLot[] = [
  {
    id: "lot-01",
    photoId: "saphir-inclusions-fantasmagoriques",
    title: "Saphir aux inclusions fantasmagoriques — avant-première",
    mineral: "Saphir · Rutile carboneux alumineux",
    imageUrl: "/gallery/saphir-inclusions-fantasmagoriques.jpg",
    startingBid: 20,
    currentBid: 28,
    endsAt: "2026-08-28T20:00:00.000Z",
    premiere: true,
    bids: 6
  },
  {
    id: "lot-02",
    photoId: "grenat-grossulaire-diamantoide",
    title: "Grenat grossulaire diamantoïde — avant-première",
    mineral: "Grenat grossulaire (démantoïde)",
    imageUrl: "/gallery/grenat-grossulaire-diamantoide.jpg",
    startingBid: 18,
    currentBid: 26,
    endsAt: "2026-08-28T20:00:00.000Z",
    premiere: true,
    bids: 4
  },
  {
    id: "lot-03",
    photoId: "aigue-marine-oeil-de-chat",
    title: "Aigue-marine œil de chat — avant-première",
    mineral: "Béryl bleu · Ilménite · Hématite · Carbone",
    imageUrl: "/gallery/aigue-marine-oeil-de-chat.jpg",
    startingBid: 18,
    currentBid: 27,
    endsAt: "2026-08-28T20:00:00.000Z",
    premiere: true,
    bids: 5
  }
];

export const SUBSCRIPTION = {
  name: "Salon Privé Mensuel",
  priceEur: 49,
  perks: [
    "Accès à la salle des ventes aux enchères",
    "Avant-premières mensuelles des plus beaux clichés",
    "Conseils du concierge IA gemmologue-photographe",
    "Badge Accès Salon Privé"
  ]
};

export function getCurrentCollection() {
  return collections[0];
}

export function getCollection(monthKey: string) {
  return collections.find((c) => c.monthKey === monthKey) ?? null;
}

export function getPhotoBySlug(slug: string) {
  for (const collection of collections) {
    const photo = collection.photos.find((p) => p.slug === slug);
    if (photo) return { photo, collection };
  }
  return null;
}

export function getAllPhotos() {
  return collections.flatMap((c) => c.photos);
}

export function formatPrice(eur: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(eur);
}

export function priceForFormat(base: number, formatId: string) {
  const format = IMAGE_FORMATS.find((f) => f.id === formatId);
  return Math.round(base * (format?.priceMultiplier ?? 1));
}
