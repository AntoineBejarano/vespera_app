"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

type Character = {
  id: string;
  name: string;
  intensity: number;
  active: boolean;
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
  const [intensity, setIntensity] = useState(
    characters.find((c) => c.id === characterId)?.intensity ?? 3,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    onError: (err) => setError(err.message),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

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

  if (!characters.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Empieza una relación
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Crea un personaje con personalidad real — no un formulario de 1500
          palabras.
        </p>
        <a
          href="/chat/new"
          className="mt-8 inline-block bg-[var(--accent)] px-6 py-3 text-[var(--bg)] transition hover:opacity-90"
        >
          Crear personaje
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-3xl flex-col px-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] py-3">
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
          Intensidad
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
          Reset chat
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <p className="text-center text-[var(--muted)]">
            {active?.name
              ? `${active.name} está aquí. Habla con naturalidad.`
              : "Escribe el primer mensaje."}
          </p>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-8 text-right"
                : "mr-8 text-left"
            }
          >
            <div
              className={
                message.role === "user"
                  ? "inline-block bg-[var(--accent-soft)] px-4 py-3 text-[var(--ink)]"
                  : "inline-block bg-[var(--bg-elevated)] px-4 py-3 text-[var(--ink)]"
              }
            >
              <div className="mb-1 text-xs uppercase tracking-wider text-[var(--muted)]">
                {message.role === "user" ? "Tú" : active?.name ?? "Personaje"}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <span key={`${message.id}-${i}`}>{part.text}</span>
                  ) : null,
                )}
              </div>
            </div>
          </div>
        ))}
        {status === "streaming" || status === "submitted" ? (
          <p className="text-sm text-[var(--muted)]">Escribiendo…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="mb-2 text-sm text-red-400">{error}</p>
      ) : null}

      <form
        className="border-t border-[var(--line)] py-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || !characterId) return;
          setError(null);
          sendMessage(
            { text: input },
            { body: { characterId } },
          );
          setInput("");
        }}
      >
        <div className="flex gap-2">
          <input
            className="flex-1 border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            value={input}
            placeholder="Escribe un mensaje…"
            onChange={(e) => setInput(e.target.value)}
            disabled={status === "streaming" || status === "submitted"}
          />
          <button
            type="submit"
            disabled={status === "streaming" || status === "submitted"}
            className="bg-[var(--accent)] px-5 py-3 text-[var(--bg)] disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
