"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { listVoiceAgents } from "@/lib/voice/agents";
import type { VoiceAgentId, VoiceCatalog } from "@/lib/voice/types";

export type { VoiceAgentId };

function isVoiceAgentId(value: string | null | undefined): value is VoiceAgentId {
  return (
    value === "luna" ||
    value === "einstein" ||
    value === "stoic-mentor" ||
    value === "tatiana"
  );
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

function peerKey(catalog: VoiceCatalog) {
  const key =
    catalog === "after-dark"
      ? "vesperer_voice_peer_after_dark"
      : "vesperer_voice_peer";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `vp_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function VoiceAgentWidget({
  compact = false,
  catalog = "sfw",
  defaultAgent,
}: {
  compact?: boolean;
  catalog?: VoiceCatalog;
  defaultAgent?: VoiceAgentId;
}) {
  const agents = useMemo(() => listVoiceAgents(catalog), [catalog]);
  const initial =
    defaultAgent &&
    isVoiceAgentId(defaultAgent) &&
    agents.some((a) => a.id === defaultAgent)
      ? defaultAgent
      : agents[0]?.id ?? "luna";

  const [agent, setAgent] = useState<VoiceAgentId>(initial);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [memories, setMemories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const active = agents.find((a) => a.id === agent) ?? agents[0];

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    return () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (
      defaultAgent &&
      isVoiceAgentId(defaultAgent) &&
      agents.some((a) => a.id === defaultAgent)
    ) {
      setAgent(defaultAgent);
    } else if (agents[0]) {
      setAgent(agents[0].id);
    }
    setTranscript("");
    setReply("");
    setMemories([]);
    setError(null);
  }, [defaultAgent, agents]);

  function stopAudio() {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setSpeaking(false);
  }

  function selectAgent(id: VoiceAgentId) {
    if (id === agent) return;
    recognitionRef.current?.stop();
    stopAudio();
    setListening(false);
    setAgent(id);
    setTranscript("");
    setReply("");
    setMemories([]);
    setError(null);
  }

  async function speak(text: string, agentId: VoiceAgentId) {
    stopAudio();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const res = await fetch("/api/voice/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, agent: agentId }),
    });

    if (!res.ok) {
      // Text still works; audio is best-effort and never surfaces provider errors.
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onplay = () => setSpeaking(true);
    audio.onended = () => setSpeaking(false);
    audio.onerror = () => setSpeaking(false);
    try {
      await audio.play();
    } catch {
      // Autoplay blocked or decode failed — keep the transcript reply.
    }
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
          peerId: peerKey(catalog),
          agent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Voice agent failed");
      setReply(data.text);
      setMemories(Array.isArray(data.memories) ? data.memories : []);
      await speak(data.text, agent);
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

    stopAudio();
    recognition.lang = "en-US";
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

  if (!active) return null;

  return (
    <div
      className={
        compact
          ? "rounded-3xl border border-[var(--line)] bg-[var(--bg-elevated)]/80 p-5"
          : "rounded-[2rem] border border-[var(--line)] bg-[var(--bg-elevated)]/85 p-6 sm:p-8"
      }
    >
      {agents.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {agents.map((item) => (
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
      ) : null}

      <div className={`flex flex-col items-center text-center ${agents.length > 1 ? "mt-6" : ""}`}>
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
          {active.blurb}
        </p>
        {active.isAdult ? (
          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[var(--accent-2)]">
            18+
          </p>
        ) : null}
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
