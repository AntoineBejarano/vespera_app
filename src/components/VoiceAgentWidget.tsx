"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LANDING_IMAGES } from "@/lib/landing/images";

export type VoiceAgentId = "luna" | "einstein" | "stoic-mentor";

const AGENTS: {
  id: VoiceAgentId;
  name: string;
  blurb: string;
  image: string;
}[] = [
  {
    id: "luna",
    name: "Luna",
    blurb: "Companion · per-user bond + emotional memory",
    image: LANDING_IMAGES.companion.src,
  },
  {
    id: "einstein",
    name: "Einstein",
    blurb: "Historical mind · remembers your questions across chat & voice",
    image: LANDING_IMAGES.einstein.src,
  },
  {
    id: "stoic-mentor",
    name: "Stoic Mentor",
    blurb: "Calm guide · creators can version and ship",
    image: LANDING_IMAGES.stoic.src,
  },
];

function isVoiceAgentId(value: string | null | undefined): value is VoiceAgentId {
  return value === "luna" || value === "einstein" || value === "stoic-mentor";
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } }; isFinal?: boolean; length: number }; length: number }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function peerKey() {
  const key = "vesperer_voice_peer";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `vp_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function VoiceAgentWidget({
  compact = false,
  defaultAgent = "luna",
}: {
  compact?: boolean;
  defaultAgent?: VoiceAgentId;
}) {
  const [agent, setAgent] = useState<VoiceAgentId>(
    isVoiceAgentId(defaultAgent) ? defaultAgent : "luna",
  );
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [memories, setMemories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const active = AGENTS.find((a) => a.id === agent) ?? AGENTS[0];

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
  }, []);

  useEffect(() => {
    if (!isVoiceAgentId(defaultAgent)) return;
    setAgent(defaultAgent);
    setTranscript("");
    setReply("");
    setMemories([]);
    setError(null);
  }, [defaultAgent]);

  function selectAgent(id: VoiceAgentId) {
    if (id === agent) return;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setListening(false);
    setSpeaking(false);
    setAgent(id);
    setTranscript("");
    setReply("");
    setMemories([]);
    setError(null);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.02;
    utter.pitch = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }

  async function sendMessage(message: string) {
    setThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/voice/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          peerId: peerKey(),
          agent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Voice agent failed");
      setReply(data.text);
      setMemories(Array.isArray(data.memories) ? data.memories : []);
      speak(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice agent failed");
    } finally {
      setThinking(false);
    }
  }

  function toggleListen() {
    setError(null);
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = getRecognition();
    if (!recognition) {
      setSupported(false);
      setError("Voice input needs Chrome, Edge, or Safari.");
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeaking(false);
    recognition.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (ev) => {
      const last = ev.results[ev.results.length - 1];
      const text = last?.[0]?.transcript?.trim() ?? "";
      setTranscript(text);
      if ((last as { isFinal?: boolean }).isFinal && text) {
        void sendMessage(text);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setError("Microphone permission denied or unavailable.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div
      className={
        compact
          ? "rounded-3xl border border-[var(--line)] bg-[var(--bg-elevated)]/80 p-5"
          : "rounded-[2rem] border border-[var(--line)] bg-[var(--bg-elevated)]/85 p-6 sm:p-8"
      }
    >
      <div className="flex flex-wrap gap-2">
        {AGENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectAgent(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium tracking-[0.04em] transition ${
              agent === item.id
                ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={toggleListen}
          disabled={thinking}
          className="group relative flex size-36 items-center justify-center rounded-full sm:size-44"
          aria-label={
            listening
              ? "Stop listening"
              : `Click to speak with ${active.name}`
          }
        >
          <span
            className={`absolute inset-0 rounded-full bg-[var(--accent)]/20 transition ${
              listening || speaking ? "animate-ping opacity-70" : "opacity-40"
            }`}
          />
          <span
            className={`absolute inset-3 overflow-hidden rounded-full ring-2 transition ${
              listening
                ? "ring-[var(--accent)]"
                : "ring-[var(--accent-2)]/40 group-hover:ring-[var(--accent)]"
            }`}
          >
            <Image
              src={active.image}
              alt=""
              fill
              className="object-cover object-top"
              sizes="176px"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </span>
          <span className="relative z-10 rounded-full bg-black/55 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur">
            {listening
              ? "Listening…"
              : thinking
                ? "Thinking…"
                : speaking
                  ? "Speaking…"
                  : "Click to speak"}
          </span>
        </button>

        <p className="mt-5 text-sm font-medium text-[var(--ink)]">
          Click to speak with {active.name}
        </p>
        <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">
          {active.blurb}. Memory sticks for you across turns.
        </p>
      </div>

      {(transcript || reply) && (
        <div className="mt-6 space-y-3 text-left text-sm">
          {transcript ? (
            <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-[var(--ink)]">
              You: {transcript}
            </p>
          ) : null}
          {reply ? (
            <p className="rounded-xl bg-[var(--bg)] px-3 py-2 text-[var(--ink)]">
              {active.name}: {reply}
            </p>
          ) : null}
        </div>
      )}

      {memories.length > 0 ? (
        <div className="mt-5 text-left">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Remembered forever
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {memories.map((m) => (
              <li
                key={m}
                className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--accent-2)]"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!supported ? (
        <p className="mt-4 text-xs text-[var(--muted)]">
          Tip: use Chrome or Edge for microphone voice input. You can still type below.
        </p>
      ) : null}

      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const message = String(fd.get("message") ?? "").trim();
          if (!message) return;
          setTranscript(message);
          e.currentTarget.reset();
          void sendMessage(message);
        }}
      >
        <input
          name="message"
          placeholder="Or type a message…"
          className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={thinking}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
