import { createHash } from "node:crypto";

export type OwnershipCertificate = {
  certificateId: string;
  photoId: string;
  photoTitle: string;
  ownerEmail: string;
  ownerName: string;
  formatId: string;
  amountEur: number;
  issuedAt: string;
  chain: "GSES-Ledger";
  txHash: string;
  previousHash: string;
  qrPayload: string;
  verificationUrl: string;
};

const GENESIS = "000000000000000000000000000000000000000000000000000000000000gses";

export function hashPayload(payload: string) {
  return createHash("sha256").update(payload).digest("hex");
}

export function issueCertificate(input: {
  photoId: string;
  photoTitle: string;
  ownerEmail: string;
  ownerName: string;
  formatId: string;
  amountEur: number;
  previousHash?: string;
}): OwnershipCertificate {
  const issuedAt = new Date().toISOString();
  const certificateId = `GSES-${hashPayload(`${input.photoId}:${input.ownerEmail}:${issuedAt}`).slice(0, 12).toUpperCase()}`;
  const previousHash = input.previousHash ?? GENESIS;
  const body = [
    certificateId,
    input.photoId,
    input.photoTitle,
    input.ownerEmail,
    input.formatId,
    String(input.amountEur),
    issuedAt,
    previousHash
  ].join("|");
  const txHash = hashPayload(body);
  const verificationUrl = `https://www.gemstoneyeshootingallery.com/certificat/${certificateId}`;
  const qrPayload = JSON.stringify({
    certificateId,
    txHash,
    photoId: input.photoId,
    owner: input.ownerEmail,
    verify: verificationUrl
  });

  return {
    certificateId,
    photoId: input.photoId,
    photoTitle: input.photoTitle,
    ownerEmail: input.ownerEmail,
    ownerName: input.ownerName,
    formatId: input.formatId,
    amountEur: input.amountEur,
    issuedAt,
    chain: "GSES-Ledger",
    txHash,
    previousHash,
    qrPayload,
    verificationUrl
  };
}
