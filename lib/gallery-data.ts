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
    priceMultiplier: 1.85
  },
  {
    id: "tableau-fineart",
    label: "Tableau Fine Art",
    description: "Master pour impression pigmentaire sur papier coton ou dibond.",
    resolution: "300 dpi · 8000×5333",
    license: "Licence privée collectionneur",
    priceMultiplier: 2.4
  },
  {
    id: "livre-double",
    label: "Double page livre",
    description: "Composition prête pour ouvrages de gemmologie et monographies.",
    resolution: "300 dpi · 7000×5000",
    license: "Licence ouvrage imprimé",
    priceMultiplier: 2.1
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
    id: "2026-07",
    monthKey: "2026-07",
    label: "Juillet 2026",
    theme: "Lueurs d'Ilakaka",
    intro:
      "Une sélection nocturne et aquatique des quartz et saphirs d'Ilakaka — lumière rasante, eau minérale et or nacré.",
    photos: [
      {
        id: "p-tourmaline-rose",
        slug: "tourmaline-rose-sahatany",
        title: "Tourmaline rose de Sahatany",
        mineral: "Tourmaline (elbaïte)",
        locality: "Sahatany, Madagascar",
        description:
          "Cristal prismatique baigné d'un halo nacré. La photographie capture la transition rose–incolore sous polarisation douce, idéale pour catalogue de foire ou tableau d'apparat.",
        technicalNote: "Macro 100 mm · lumière continuum LED · fond aqua pierreux",
        priceEur: 480,
        imageUrl:
          "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1600&q=80",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      },
      {
        id: "p-saphir-bleu",
        slug: "saphir-bleu-ilakaka",
        title: "Saphir bleu d'Ilakaka",
        mineral: "Corindon (saphir)",
        locality: "Ilakaka, Madagascar",
        description:
          "Cabochon et cristal brut confrontés dans un bassin minéral. Reflets aquatiques, grain pierreux et or doux pour magazines de gemmologie.",
        technicalNote: "Focus stacking · diffusion nacrée · polariseur circulaire",
        priceEur: 620,
        imageUrl:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart"]
      },
      {
        id: "p-quartz-fume",
        slug: "quartz-fume-antanety",
        title: "Quartz fumé d'Antanety",
        mineral: "Quartz fumé",
        locality: "Antanety, Madagascar",
        description:
          "Prisme monumental photographié comme une architecture liquide. Contraste or/teal pour mise en scène d'exposition.",
        technicalNote: "Grand angle contrôlé · lumière directionnelle basse",
        priceEur: 390,
        imageUrl:
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1600&q=80",
        featured: false,
        formats: ["editorial-a4", "tableau-fineart", "livre-double"]
      },
      {
        id: "p-labradorite",
        slug: "labradorite-iridescente",
        title: "Labradorite iridescente",
        mineral: "Labradorite",
        locality: "Hauts Plateaux, Madagascar",
        description:
          "Schiller bleu-vert saisi au moment où la nacre optique croise l'or. Cliché prêt pour couverture de revue.",
        technicalNote: "Angle Specular · ISO bas · trépied studio",
        priceEur: 540,
        imageUrl:
          "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1600&q=80",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart", "livre-double"]
      }
    ]
  },
  {
    id: "2026-06",
    monthKey: "2026-06",
    label: "Juin 2026",
    theme: "Émeraudes & eaux profondes",
    intro:
      "Archives de juin : béryls verts et inclusions aquatiques — une lecture gemmologique de la lumière sous-marine.",
    photos: [
      {
        id: "p-emeraude",
        slug: "emeraude-mananjary",
        title: "Émeraude de Mananjary",
        mineral: "Béryl (émeraude)",
        locality: "Mananjary, Madagascar",
        description:
          "Cristal terminé sur gangue, photographié dans un bain de lumière aquatique. Destiné aux ouvrages scientifiques et aux stands de foire.",
        technicalNote: "Macro empilée · balance nacrée calibrée",
        priceEur: 710,
        imageUrl:
          "https://images.unsplash.com/photo-1596944924616-7b38e7cfac86?auto=format&fit=crop&w=1600&q=80",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "livre-double"]
      },
      {
        id: "p-amethyste",
        slug: "amethyste-geode",
        title: "Géode d'améthyste",
        mineral: "Quartz améthyste",
        locality: "Sud malgache",
        description:
          "Cavité cristalline traitée comme une architecture sacrée. Format tableau recommandé pour collectionneurs.",
        technicalNote: "Éclairage fibre · ombre pierreuse contrôlée",
        priceEur: 450,
        imageUrl:
          "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1600&q=80",
        featured: false,
        formats: ["tableau-fineart", "expo-grand"]
      },
      {
        id: "p-citrine",
        slug: "citrine-miel",
        title: "Citrine miel",
        mineral: "Quartz citrine",
        locality: "Madagascar",
        description:
          "Teinte or nacré pure — le cliché dialogue avec le style de la galerie. Parfait pour magazines lifestyle gemmologie.",
        technicalNote: "Fond dégradé aqua-or · netteté optique",
        priceEur: 360,
        imageUrl:
          "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1600&q=80",
        featured: false,
        formats: ["editorial-a4", "tableau-fineart"]
      }
    ]
  },
  {
    id: "2026-05",
    monthKey: "2026-05",
    label: "Mai 2026",
    theme: "Grenats du sud",
    intro: "Archives de mai : grenats pyrope-almandin et lumière minérale chaude sur textures pierreuses.",
    photos: [
      {
        id: "p-grenat",
        slug: "grenat-pyrope",
        title: "Grenat pyrope",
        mineral: "Grenat pyrope",
        locality: "Sud de Madagascar",
        description:
          "Rouge profond sous voile aquatique. Composition sobre pour catalogues de foire aux minerais.",
        technicalNote: "Boîte à lumière · fond stone grain",
        priceEur: 410,
        imageUrl:
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1600&q=80",
        featured: true,
        formats: ["editorial-a4", "expo-grand", "tableau-fineart"]
      },
      {
        id: "p-morganite",
        slug: "morganite-pastel",
        title: "Morganite pastel",
        mineral: "Béryl (morganite)",
        locality: "Pegmatites malgaches",
        description:
          "Rose nacré photographié comme une perle minérale. Tirage Fine Art recommandé.",
        technicalNote: "Softbox double · polarisation partielle",
        priceEur: 580,
        imageUrl:
          "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=80",
        featured: false,
        formats: ["tableau-fineart", "livre-double"]
      }
    ]
  }
];

export const auctionLots: AuctionLot[] = [
  {
    id: "lot-01",
    photoId: "p-premiere-spinelle",
    title: "Spinelle rouge — avant-première",
    mineral: "Spinelle",
    imageUrl:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=80",
    startingBid: 900,
    currentBid: 1240,
    endsAt: "2026-08-15T20:00:00.000Z",
    premiere: true,
    bids: 7
  },
  {
    id: "lot-02",
    photoId: "p-premiere-alexandrite",
    title: "Alexandrite changeante — salon privé",
    mineral: "Chrysobéryl",
    imageUrl:
      "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1400&q=80",
    startingBid: 1200,
    currentBid: 1580,
    endsAt: "2026-08-15T20:00:00.000Z",
    premiere: true,
    bids: 11
  },
  {
    id: "lot-03",
    photoId: "p-premiere-pegmatite",
    title: "Pegmatite monumentale — cliché exclusif",
    mineral: "Pegmatite à tourmaline",
    imageUrl:
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1400&q=80",
    startingBid: 750,
    currentBid: 890,
    endsAt: "2026-08-15T20:00:00.000Z",
    premiere: false,
    bids: 4
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
