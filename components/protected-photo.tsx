"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  watermark?: string;
};

export function ProtectedPhoto({
  src,
  alt,
  className,
  priority,
  watermark = "Gem'StonEye · aperçu protégé"
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [alert, setAlert] = useState(false);

  const flashAlert = useCallback(() => {
    setAlert(true);
    window.setTimeout(() => setAlert(false), 1600);
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

    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const combo =
        (event.ctrlKey || event.metaKey) &&
        (key === "s" || key === "p" || key === "u" || (event.shiftKey && key === "i"));
      if (key === "printscreen" || combo) {
        event.preventDefault();
        flashAlert();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        node.classList.add("brightness-50", "blur-sm");
      } else {
        node.classList.remove("brightness-50", "blur-sm");
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      node.removeEventListener("contextmenu", block);
      node.removeEventListener("dragstart", block);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flashAlert]);

  return (
    <div
      ref={frameRef}
      className={cn(
        "protected-media group relative overflow-hidden bg-aqua-deep/10 transition duration-500",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover saturate-[.92] contrast-[1.02]"
      />
      <div className="photo-filter-overlay absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(250,248,244,.5) 0 2px, transparent 2px 11px)"
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-aqua-deep/55 to-transparent p-4">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foam/90">
          <Shield className="h-3.5 w-3.5" />
          {watermark}
        </p>
      </div>
      {alert ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-aqua-deep/70 backdrop-blur-md">
          <p className="max-w-xs px-4 text-center font-display text-xl text-foam">
            Capture et téléchargement bloqués — fichier master après virement.
          </p>
        </div>
      ) : null}
    </div>
  );
}
