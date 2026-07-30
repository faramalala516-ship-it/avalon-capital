import { describe, expect, it } from "vitest";
import { buildConciergeReply } from "../lib/concierge-ai";
import { issueCertificate, hashPayload } from "../lib/blockchain";
import { priceForFormat } from "../lib/gallery-data";

describe("concierge", () => {
  it("répond sur la gemmologie et les formats", () => {
    const answer = buildConciergeReply("Parlez-moi du saphir d'Ilakaka et du format tableau");
    expect(answer.toLowerCase()).toContain("concierge");
    expect(answer.length).toBeGreaterThan(80);
  });
});

describe("blockchain certificate", () => {
  it("émet une empreinte SHA-256 et un QR payload", () => {
    const cert = issueCertificate({
      photoId: "p-test",
      photoTitle: "Test",
      ownerEmail: "buyer@example.eu",
      ownerName: "Buyer",
      formatId: "tableau-fineart",
      amountEur: 500
    });
    expect(cert.certificateId.startsWith("GSES-")).toBe(true);
    expect(cert.txHash).toHaveLength(64);
    expect(cert.qrPayload).toContain(cert.certificateId);
    expect(hashPayload("abc")).toHaveLength(64);
  });
});

describe("pricing", () => {
  it("applique le multiplicateur Fine Art", () => {
    expect(priceForFormat(100, "tableau-fineart")).toBe(155);
  });
});
