"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; content: string };

const starters = [
  "Quelle collection du mois me recommandez-vous ?",
  "Différence entre format tableau et éditorial ?",
  "Comment fonctionne le virement et le certificat ?",
  "Comment rejoindre la salle des enchères ?"
];

export function AiConcierge() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Bonjour — je suis le concierge-gallériste de Gem'StonEye'Shootin'Gallery. Gemmologie, photographie, formats, enchères : où puis-je vous guider ?"
    }
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed })
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer ?? "Je suis momentanément indisponible." }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connexion interrompue. Réessayez — ou parcourez la Galerie shooting."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-sm bg-aqua-deep px-4 py-3 text-sm text-foam shadow-pearl transition hover:bg-[#124a54]"
      >
        <Sparkles className="h-4 w-4 text-gold-soft" />
        Concierge IA
      </button>

      {open ? (
        <div className="no-print fixed bottom-5 right-5 z-[70] flex h-[min(560px,78vh)] w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-sm border border-gold/30 bg-foam shadow-pearl">
          <div className="flex items-center justify-between border-b border-gold/20 bg-nacre/60 px-4 py-3">
            <div>
              <p className="font-display text-lg text-aqua-deep">Concierge gallériste</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">
                Gemmologie · Photographie
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">
              <X className="h-5 w-5 text-stone" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={
                  msg.role === "user"
                    ? "ml-8 rounded-sm bg-aqua-deep px-3 py-2 text-sm text-foam"
                    : "mr-4 rounded-sm border border-gold/20 bg-white/70 px-3 py-2 text-sm leading-6 text-ink"
                }
              >
                {msg.role === "assistant" ? (
                  <span className="mb-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-gold-deep">
                    <MessageCircle className="h-3 w-3" /> Concierge
                  </span>
                ) : null}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {loading ? (
              <p className="text-xs uppercase tracking-[0.16em] text-stone">Le concierge rédige…</p>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="space-y-2 border-t border-gold/15 px-3 py-3">
            <div className="flex flex-wrap gap-1.5">
              {starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void ask(s)}
                  className="rounded-sm border border-gold/25 bg-white/60 px-2 py-1 text-[11px] text-stone-deep hover:bg-nacre"
                >
                  {s}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                className="h-10 flex-1 rounded-sm border border-gold/25 bg-white/80 px-3 text-sm outline-none ring-gold/40 focus:ring-2"
              />
              <Button type="submit" size="sm" disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
