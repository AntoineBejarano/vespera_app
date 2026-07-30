"use client";

import { useEffect, useRef, useState } from "react";
import {
  randomBetweenBubblesMs,
  randomReplyDelayMs,
  sleep,
} from "@/lib/chat/humanize";

type Character = {
  id: string;
  name: string;
  intensity: number;
  active: boolean;
};

type BubbleMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
};

export function ChatPanel({
  characters,
  initialCharacterId,
}: {
  characters: Character[];
  initialCharacterId?: string;
}) {
  const [characterId, setCharacterId] = useState(
    initialCharacterId ?? characters.find((c) => c.active)?.id ?? characters[0]?.id,
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<BubbleMsg[]>([]);
  const [intensity, setIntensity] = useState(
    characters.find((c) => c.id === characterId)?.intensity ?? 3,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const active = characters.find((c) => c.id === characterId);

  async function switchCharacter(id: string) {
    setCharacterId(id);
    setMessages([]);
    setError(null);
    const char = characters.find((c) => c.id === id);
    if (char) setIntensity(char.intensity);
    await fetch(`/api/characters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true }),
    });
  }

  async function updateIntensity(value: number) {
    setIntensity(value);
    if (!characterId) return;
    await fetch(`/api/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intensity: value }),
    });
  }

  async function resetChat() {
    if (!characterId) return;
    await fetch(`/api/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetChat: true }),
    });
    setMessages([]);
  }

  async function send() {
    if (!input.trim() || !characterId || busy) return;
    const userText = input.trim();
    setInput("");
    setError(null);
    setBusy(true);
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: "user", text: userText },
    ]);

    setTyping(true);
    await sleep(randomReplyDelayMs());

    try {
      const res = await fetch("/api/chat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, characterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        setTyping(false);
        setBusy(false);
        return;
      }

      const bubbles: string[] = data.bubbles?.length
        ? data.bubbles
        : [data.text];
      let photoDone = false;

      for (let i = 0; i < bubbles.length; i++) {
        if (i > 0) {
          setTyping(true);
          await sleep(randomBetweenBubblesMs());
        }
        setTyping(false);
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}-${i}`,
            role: "assistant",
            text: bubbles[i]!,
          },
        ]);

        if (
          !photoDone &&
          data.photo?.url &&
          (i === 0 || i === Math.min(1, bubbles.length - 1))
        ) {
          await sleep(randomBetweenBubblesMs());
          setMessages((m) => [
            ...m,
            {
              id: `p-${Date.now()}`,
              role: "assistant",
              text: "",
              imageUrl: data.photo.url,
            },
          ]);
          photoDone = true;
        }
      }

      if (data.photo?.url && !photoDone) {
        await sleep(randomBetweenBubblesMs());
        setMessages((m) => [
          ...m,
          {
            id: `p-${Date.now()}`,
            role: "assistant",
            text: "",
            imageUrl: data.photo.url,
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setTyping(false);
      setBusy(false);
    }
  }

  if (!characters.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
          Admin · test
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          No persona
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Create one first — Telegram bots and the chat API attach to personas.
        </p>
        <a
          href="/personas/new"
          className="mt-8 inline-block bg-[var(--accent)] px-6 py-3 text-[var(--bg)] transition hover:opacity-90"
        >
          Create persona
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-3xl flex-col px-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] py-3">
        <span className="rounded border border-[var(--line)] px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Admin test
        </span>
        <select
          className="border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
          value={characterId}
          onChange={(e) => switchCharacter(e.target.value)}
        >
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          Intensity
          <input
            type="range"
            min={1}
            max={5}
            value={intensity}
            onChange={(e) => updateIntensity(Number(e.target.value))}
          />
          <span className="w-4 text-[var(--ink)]">{intensity}</span>
        </label>
        <button
          type="button"
          onClick={resetChat}
          className="ml-auto text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted)]">
            Simulates Telegram (multi-bubble, delay, typos). Product: linked
            bots.
          </p>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user" ? "ml-8 text-right" : "mr-8 text-left"
            }
          >
            <div
              className={
                message.role === "user"
                  ? "inline-block max-w-[85%] bg-[var(--accent-soft)] px-4 py-2.5 text-left text-[var(--ink)]"
                  : "inline-block max-w-[85%] bg-[var(--bg-elevated)] px-4 py-2.5 text-[var(--ink)]"
              }
            >
              {message.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.imageUrl}
                  alt=""
                  className="mb-2 max-h-64 max-w-full rounded-sm object-cover"
                />
              ) : null}
              {message.text ? (
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.text}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {typing ? (
          <p className="text-sm text-[var(--muted)]">typing…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="mb-2 text-sm text-red-400">{error}</p> : null}

      <form
        className="border-t border-[var(--line)] py-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex gap-2">
          <input
            className="flex-1 border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            value={input}
            placeholder="Test message…"
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-[var(--accent)] px-5 py-3 text-[var(--bg)] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
