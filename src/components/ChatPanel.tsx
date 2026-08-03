"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  randomBetweenBubblesMs,
  randomReplyDelayMs,
  sleep,
} from "@/lib/chat/humanize";
import { AnimatedList } from "@/components/magicui/animated-list";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    initialCharacterId ??
      characters.find((c) => c.active)?.id ??
      characters[0]?.id,
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<BubbleMsg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const active = characters.find((c) => c.id === characterId);

  function switchCharacter(id: string) {
    setCharacterId(id);
    setMessages([]);
    setError(null);
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
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground">
          No persona yet
        </h1>
        <p className="mt-3 text-muted-foreground">
          Create one first — Telegram bots and the chat API attach to personas.
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link href="/personas/new">Create persona</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-3xl flex-col px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-border py-2.5 sm:gap-3 sm:py-3">
        <Link
          href={`/personas/${characterId}`}
          className="max-w-[40%] truncate text-sm text-muted-foreground hover:text-foreground"
        >
          ← {active?.name ?? "Persona"}
        </Link>
        {characters.length > 1 ? (
          <select
            className="h-8 max-w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={characterId}
            onChange={(e) => switchCharacter(e.target.value)}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => void resetChat()}
        >
          Reset
        </Button>
      </div>

      <div className="mt-3 flex-1 overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-full space-y-1 overflow-y-auto px-4 py-5">
          {messages.length === 0 ? (
            <>
              <p className="pt-4 text-center text-xs text-muted-foreground">
                AI persona — automated replies. Not a human operator unless a
                handoff is clearly stated.
              </p>
              <p className="pt-2 text-center text-sm text-muted-foreground">
                Test chat for this persona — same multi-bubble pacing as
                Telegram.
              </p>
            </>
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
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border bg-background text-foreground",
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
            <div className="mt-3 text-sm text-muted-foreground">
              <TypingAnimation typeSpeed={55}>typing</TypingAnimation>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : null}

      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex gap-2">
          <Input
            className="h-10 min-w-0 flex-1"
            value={input}
            placeholder="Message…"
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <Button type="submit" disabled={busy} className="h-10 px-5">
            {busy ? "…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
