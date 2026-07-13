"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Pause, Play, Send, Sparkles, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agentValidationProtocol, aiAgents } from "@/lib/data";
import { cn } from "@/lib/utils";

type SpeechState = "idle" | "speaking" | "paused";
type VoiceCommandState = "idle" | "listening";
type SpeechRecognitionResultLike = { 0?: { transcript?: string } };
type SpeechRecognitionEventLike = { results: { length: number; [index: number]: SpeechRecognitionResultLike } };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

const masculineVoiceHints = [
  "kyrin",
  "henri",
  "paul",
  "thomas",
  "antoine",
  "daniel",
  "claude",
  "remy",
  "luc",
  "nicolas",
  "guillaume",
  "gerard",
  "pierre",
  "jean",
  "louis",
  "hugo",
  "alexandre",
  "male",
  "homme",
  "man"
];

const feminineVoiceHints = [
  "hortense",
  "julie",
  "denise",
  "sylvie",
  "audrey",
  "amelie",
  "celine",
  "marie",
  "helene",
  "lea",
  "zira",
  "susan",
  "samantha",
  "female",
  "femme",
  "woman"
];

const prompts = [
  "Analyse du Nasdaq avec scenario Fed et niveaux de risque",
  "Detecte le sentiment global risk-on/risk-off",
  "Fais un rapport Macro-X complet sur les marches globaux",
  "Analyse XAUUSD en GEM-Trading avec entree, SL, TP1/TP2/TP3",
  "Propose une idee swing trade structuree sur XAUUSD",
  "Resume l'impact d'une surprise CPI sur EURUSD",
  "Controle le risque d'un portefeuille equity/or/cash"
];

function normalizedVoiceText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreVoice(voice: SpeechSynthesisVoice) {
  const name = normalizedVoiceText(voice.name);
  const lang = normalizedVoiceText(voice.lang);
  let score = 0;

  if (lang.startsWith("fr")) score += 120;
  if (lang === "fr-fr") score += 25;
  if (name.includes("natural")) score += 20;
  if (name.includes("neural")) score += 18;
  if (name.includes("online")) score += 10;
  if (name.includes("microsoft")) score += 6;
  if (name.includes("google")) score += 4;
  if (voice.localService) score += 2;

  for (const hint of masculineVoiceHints) {
    if (name.includes(hint)) score += hint === "kyrin" ? 1000 : 55;
  }

  for (const hint of feminineVoiceHints) {
    if (name.includes(hint)) score -= 80;
  }

  return score;
}

function selectPreferredVoice(voices: SpeechSynthesisVoice[]) {
  return [...voices].sort((left, right) => scoreVoice(right) - scoreVoice(left))[0] ?? null;
}

export function MarketAiAssistant() {
  const [agentId, setAgentId] = useState(aiAgents[0].id);
  const [question, setQuestion] = useState(prompts[0]);
  const [answer, setAnswer] = useState(
    "Selectionnez un agent et une demande pour obtenir une analyse structuree: contexte macro, sentiment, niveaux, scenarios, invalidation et discipline du risque."
  );
  const [loading, setLoading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceCommandSupported, setVoiceCommandSupported] = useState(false);
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [voiceCommandState, setVoiceCommandState] = useState<VoiceCommandState>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const selectedAgent = aiAgents.find((agent) => agent.id === agentId) ?? aiAgents[0];
  const quickPrompts = selectedAgent.examples ?? prompts;
  const speechText = useMemo(
    () =>
      answer
        .replace(/[#*_`>|-]/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    [answer]
  );
  const selectedVoice = useMemo(() => {
    const selected = voices.find((voice) => voice.voiceURI === selectedVoiceURI);
    return selected ?? selectPreferredVoice(voices);
  }, [selectedVoiceURI, voices]);

  useEffect(() => {
    const browserWindow = window as SpeechWindow;
    const canSpeak = "speechSynthesis" in browserWindow && typeof SpeechSynthesisUtterance !== "undefined";
    setSpeechSupported(canSpeak);
    setVoiceCommandSupported(Boolean(browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition));

    if (canSpeak) {
      const loadVoices = () => {
        const browserVoices = browserWindow.speechSynthesis.getVoices();
        setVoices(browserVoices);
        setSelectedVoiceURI((current) => current || (selectPreferredVoice(browserVoices)?.voiceURI ?? ""));
      };

      loadVoices();
      browserWindow.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      browserWindow.speechSynthesis?.cancel();
      if ("speechSynthesis" in browserWindow) {
        browserWindow.speechSynthesis.onvoiceschanged = null;
      }
      recognitionRef.current?.abort();
    };
  }, []);

  async function submit(value = question) {
    stopSpeech();
    setLoading(true);
    setQuestion(value);
    const response = await fetch("/api/market-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: selectedAgent.id,
        question: value
      })
    });
    const data = (await response.json()) as { answer: string };
    setAnswer(data.answer);
    setLoading(false);
  }

  function speakAnalysis() {
    if (!speechSupported || !speechText) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.pitch = 0.72;
    utterance.volume = 1;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || "fr-FR";
    }
    utterance.onend = () => setSpeechState("idle");
    utterance.onerror = () => setSpeechState("idle");
    utteranceRef.current = utterance;
    setSpeechState("speaking");
    window.speechSynthesis.speak(utterance);
  }

  function pauseSpeech() {
    if (!speechSupported || !window.speechSynthesis.speaking || window.speechSynthesis.paused) {
      return;
    }

    window.speechSynthesis.pause();
    setSpeechState("paused");
  }

  function resumeSpeech() {
    if (!speechSupported || !window.speechSynthesis.paused) {
      return;
    }

    window.speechSynthesis.resume();
    setSpeechState("speaking");
  }

  function stopSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeechState("idle");
  }

  function handleVoiceCommand(transcript: string) {
    const command = transcript
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (command.includes("pause")) {
      pauseSpeech();
      return;
    }

    if (command.includes("reprend") || command.includes("continue")) {
      resumeSpeech();
      return;
    }

    if (command.includes("stop") || command.includes("arret") || command.includes("arrete")) {
      stopSpeech();
      return;
    }

    if (command.includes("lire") || command.includes("lecture") || command.includes("lis")) {
      speakAnalysis();
    }
  }

  function startVoiceCommand() {
    const browserWindow = window as SpeechWindow;
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    if (!Recognition || voiceCommandState === "listening") {
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript ?? "";
      handleVoiceCommand(transcript);
    };
    recognition.onerror = () => setVoiceCommandState("idle");
    recognition.onend = () => setVoiceCommandState("idle");
    recognitionRef.current = recognition;
    setVoiceCommandState("listening");
    recognition.start();
  }

  return (
    <div className="glass rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-bullion">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-white">Avalon Market AI</h2>
        </div>
        <span className="rounded-md bg-bullion/10 px-2 py-1 text-xs font-semibold text-bullion">
          {selectedAgent.authority}
        </span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {aiAgents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setAgentId(agent.id)}
            className={cn(
              "rounded-md border p-3 text-left text-sm transition",
              agent.id === agentId
                ? "border-bullion/60 bg-bullion/10 text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              <agent.icon className="h-4 w-4 text-bullion" />
              {agent.name}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-white/10 bg-black/25 p-4">
        <p className="text-sm leading-6 text-slate-300">{selectedAgent.role}</p>
        <dl className="mt-3 grid gap-3 text-xs text-slate-400 md:grid-cols-3">
          <div>
            <dt className="text-slate-500">Donnees</dt>
            <dd className="mt-1">{selectedAgent.inputs}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Methode</dt>
            <dd className="mt-1">{selectedAgent.method}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Sortie</dt>
            <dd className="mt-1">{selectedAgent.output}</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-md border border-bullion/20 bg-bullion/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-bullion">
            Protocole anti-hallucination
          </p>
          <ul className="mt-3 grid gap-2 text-xs leading-5 text-slate-300 md:grid-cols-2">
            {agentValidationProtocol.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => void submit(prompt)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-w-0 flex-1 rounded-md border-white/10 bg-black/30 text-sm text-white placeholder:text-slate-500"
          placeholder="Demander une analyse institutionnelle"
        />
        <Button onClick={() => void submit()} disabled={loading}>
          <Send className="h-4 w-4" />
          {loading ? "Analyse" : "Envoyer"}
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
        <Button
          onClick={speakAnalysis}
          disabled={!speechSupported || !speechText}
          size="sm"
          variant="secondary"
          title="Lire l'analyse IA"
        >
          <Volume2 className="h-4 w-4" />
          Lire
        </Button>
        <Button
          onClick={speechState === "paused" ? resumeSpeech : pauseSpeech}
          disabled={!speechSupported || speechState === "idle"}
          size="sm"
          variant="ghost"
          title={speechState === "paused" ? "Reprendre la lecture" : "Mettre la lecture en pause"}
        >
          {speechState === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {speechState === "paused" ? "Reprendre" : "Pause"}
        </Button>
        <Button
          onClick={stopSpeech}
          disabled={!speechSupported || speechState === "idle"}
          size="sm"
          variant="ghost"
          title="Arreter la lecture"
        >
          <Square className="h-4 w-4" />
          Stop
        </Button>
        <Button
          onClick={startVoiceCommand}
          disabled={!voiceCommandSupported || voiceCommandState === "listening"}
          size="sm"
          variant="secondary"
          title='Commande vocale: dites "lire", "pause", "reprendre" ou "stop"'
        >
          <Mic className="h-4 w-4" />
          {voiceCommandState === "listening" ? "Ecoute" : "Voix"}
        </Button>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-slate-300">
          {speechSupported
            ? speechState === "speaking"
              ? "Lecture"
              : speechState === "paused"
                ? "Pause"
                : "Pret"
            : "Audio indisponible"}
        </span>
        {voices.length > 0 ? (
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-400">
            Voix
            <select
              value={selectedVoice?.voiceURI ?? ""}
              onChange={(event) => {
                stopSpeech();
                setSelectedVoiceURI(event.target.value);
              }}
              className="min-w-0 flex-1 rounded-md border-white/10 bg-black/30 py-1 text-xs text-white"
              title="Choisir une voix de lecture"
            >
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <pre className="mt-5 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/30 p-4 font-sans text-sm leading-6 text-slate-200">
        {answer}
      </pre>
    </div>
  );
}
