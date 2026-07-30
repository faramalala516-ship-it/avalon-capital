export type PurchaseRecord = {
  id: string;
  photoId: string;
  photoTitle: string;
  mineral: string;
  formatId: string;
  amountEur: number;
  status: "awaiting_transfer" | "confirmed";
  reference: string;
  purchasedAt: string;
  certificateId?: string;
  txHash?: string;
};

export type GalleryUser = {
  email: string;
  name: string;
  createdAt: string;
  subscriptionActive: boolean;
  purchases: PurchaseRecord[];
  badges: string[];
};

const STORAGE_KEY = "gses.user.v1";

export function emptyUser(email: string, name: string): GalleryUser {
  return {
    email: email.trim().toLowerCase(),
    name: name.trim() || email.split("@")[0],
    createdAt: new Date().toISOString(),
    subscriptionActive: false,
    purchases: [],
    badges: []
  };
}

export function readStoredUser(): GalleryUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GalleryUser;
  } catch {
    return null;
  }
}

export function writeStoredUser(user: GalleryUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("gses-user-updated"));
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("gses-user-updated"));
}

export function computeBadges(user: GalleryUser) {
  const badges = new Set<string>();
  const count = user.purchases.filter((p) => p.status === "confirmed").length;
  if (count >= 1) badges.add("eclat-premier");
  if (count >= 3) badges.add("cabinet-curieux");
  if (count >= 5) badges.add("mecene-gemmologue");
  if (user.subscriptionActive) badges.add("salon-prive");
  return Array.from(badges);
}

export function makeOrderReference() {
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `GSES-${rand}`;
}
