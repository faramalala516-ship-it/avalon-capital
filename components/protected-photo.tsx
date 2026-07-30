"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  watermark?: string;
  /** cover = grille ; contain = page détail (qualité intacte, pas de crop) */
  fit?: "cover" | "contain";
  /** When true (default), blanks the frame on blur / PrintScreen attempts. */
  blockScreenshots?: boolean;
};

export function ProtectedPhoto({
  src,
  alt,
  className,
  priority,
  watermark = "Gem'StonEye · aperçu protégé",
  fit = "cover",
  blockScreenshots = true
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [alert, setAlert] = useState(false);
  const [shielded, setShielded] = useState(false);

  const flashAlert = useCallback((ms = 1800) => {
    setAlert(true);
    window.setTimeout(() => setAlert(false), ms);
  }, []);

  const engageShield = useCallback(() => {
    if (!blockScreenshots) return;
    setShielded(true);
  }, [blockScreenshots]);

  const releaseShield = useCallback(() => {
    setShielded(false);
  }, []);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;

    const block = (event: Event) => {
      event.preventDefault();
      flashAlert();
    };

    node.addEventListener("contextmenu", block);
    node.addEventListener("dragstart", block);
    node.addEventListener("copy", block);

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const combo =
        (event.ctrlKey || event.metaKey) &&
        (key === "s" || key === "p" || key === "u" || (event.shiftKey && key === "i"));

      if (key === "printscreen" || combo) {
        event.preventDefault();
        engageShield();
        flashAlert();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "printscreen") {
        engageShield();
        flashAlert(2200);
        void navigator.clipboard?.writeText?.("Capture bloquée — Gem'StonEye'Shootin'Gallery").catch(() => undefined);
        window.setTimeout(releaseShield, 2500);
      }
    };

    const onVisibility = () => {
      if (!blockScreenshots) return;
      if (document.visibilityState === "hidden") engageShield();
      else releaseShield();
    };

    const onBlur = () => {
      if (!blockScreenshots) return;
      engageShield();
    };

    const onFocus = () => {
      if (document.visibilityState === "visible") releaseShield();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      node.removeEventListener("contextmenu", block);
      node.removeEventListener("dragstart", block);
      node.removeEventListener("copy", block);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [blockScreenshots, engageShield, flashAlert, releaseShield]);

  return (
    <div
      ref={frameRef}
      className={cn(
        "protected-media group relative overflow-hidden bg-[#e8eeec] transition duration-300",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"
        className={cn(
          fit === "contain" ? "object-contain" : "object-cover",
          "transition-[filter,opacity] duration-150",
          shielded ? "opacity-0" : "opacity-100"
        )}
        draggable={false}
        quality={100}
      />

      {/* Light watermark — does not tint gem colors */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <div
          className="absolute -left-1/4 -top-1/4 flex h-[150%] w-[150%] flex-wrap content-center gap-x-12 gap-y-20 opacity-[0.11]"
          style={{ transform: "rotate(-28deg)" }}
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-[12px] font-medium tracking-[0.24em] text-white mix-blend-difference sm:text-[13px]"
            >
              {watermark}
            </span>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 via-transparent to-transparent px-4 pb-3 pt-12">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/85">{watermark}</p>
      </div>

      {shielded ? (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-[#1a2428]">
          <p className="max-w-xs px-4 text-center font-display text-lg text-foam/90">
            Capture d&apos;écran bloquée
            <br />
            <span className="text-sm text-aqua-mist">Le cliché est masqué pendant la capture.</span>
          </p>
        </div>
      ) : null}

      {alert ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1a2428]/85">
          <p className="max-w-xs px-4 text-center font-display text-xl text-foam">
            Capture et téléchargement bloqués — master disponible après paiement.
          </p>
        </div>
      ) : null}
    </div>
  );
}
