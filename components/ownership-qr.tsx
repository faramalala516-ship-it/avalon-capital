"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  payload: string;
  label?: string;
};

export function OwnershipQr({ payload, label = "QR d'appartenance" }: Props) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let alive = true;
    void QRCode.toDataURL(payload, {
      width: 220,
      margin: 1,
      color: { dark: "#0d3d45", light: "#faf8f4" }
    }).then((url) => {
      if (alive) setDataUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [payload]);

  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-sm border border-gold/25 bg-white/70 p-3">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={label} width={160} height={160} className="h-40 w-40" />
      ) : (
        <div className="h-40 w-40 animate-pulse bg-nacre" />
      )}
      <p className="text-[10px] uppercase tracking-[0.18em] text-gold-deep">{label}</p>
    </div>
  );
}
