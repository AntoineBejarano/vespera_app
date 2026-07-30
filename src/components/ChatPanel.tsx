"use client";

import { useEffect, useRef, useState } from "react";
import {
  randomBetweenBubblesMs,
  randomReplyDelayMs,
  sleep,
} from "@/lib/chat/humanize";
import { AnimatedList } from "@/components/magicui/animated-list";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { BorderBeam } from "@/components/magicui/border-beam";
import { cn } from "@/lib/utils";

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
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--accent)]">
          Admin · test
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
          No persona
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Create one first — Telegram bots and the chat API attach to personas.
        </p>
        <a
          href="/personas/new"
          className="mt-8 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-white transition hover:opacity-90"
        >
          Create persona
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-3xl flex-col px-4 pb-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] py-3">
        <a
          href={`/personas/${characterId}`}
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          ← {active?.name ?? "Persona"}
        </a>
        <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Test chat
        </span>
        {characters.length > 1 ? (
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
        ) : (
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--ink)]">
            {active?.name}
          </span>
        )}
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
        <a
          href={`/personas/${characterId}/memory`}
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          Memory
        </a>
        <button
          type="button"
          onClick={resetChat}
          className="ml-auto text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="relative mt-3 flex-1 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70">
        <BorderBeam
          size={80}
          duration={9}
          colorFrom="#ff4d6d"
          colorTo="#ffb4a2"
          borderWidth={1.5}
        />
        <div className="h-full space-y-1 overflow-y-auto px-4 py-5">
          {messages.length === 0 ? (
            <p className="pt-16 text-center text-sm text-[var(--muted)]">
              Simulates Telegram (multi-bubble, delay, typos). Product: linked
              bots.
            </p>
          ) : (
            <AnimatedList instant delay={60} className="gap-2.5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      message.role === "user"
                        ? "rounded-br-md bg-[var(--accent)] text-white"
                        : "rounded-bl-md border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]",
                    )}
                  >
                    {message.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={message.imageUrl}
                        alt=""
                        className="mb-2 max-h-64 max-w-full rounded-xl object-cover"
                      />
                    ) : null}
                    {message.text ? (
                      <div className="whitespace-pre-wrap">{message.text}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </AnimatedList>
          )}
          {typing ? (
            <div className="mt-3 text-sm text-[var(--muted)]">
              <TypingAnimation typeSpeed={55}>typing</TypingAnimation>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}

      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex gap-2">
          <input
            className="flex-1 border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            value={input}
            placeholder="Message the agent…"
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[var(--accent)] px-5 py-3 font-medium text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
