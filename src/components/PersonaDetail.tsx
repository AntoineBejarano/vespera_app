"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PHOTO_TAG_OPTIONS } from "@/lib/chat/photos";
import { MagicCard } from "@/components/magicui/magic-card";

type Bot = {
  id: string;
  username: string;
  active: boolean;
  label: string | null;
  peerCount: number;
  tokenMasked: string;
};

type Photo = {
  id: string;
  url: string;
  kind: string;
  tags: string[];
  caption: string | null;
};

type Persona = {
  id: string;
  name: string;
  intensity: number;
  active: boolean;
  hasApiKey: boolean;
  soulMd: string;
  styleMd: string;
  rulesMd: string;
  contextMd: string;
  bots: Bot[];
  photos: Photo[];
  relationshipCount: number;
};

const DOC_FIELDS = [
  {
    key: "soulMd" as const,
    label: "Soul",
    hint: "Who she is — stable identity, temperament, desires.",
  },
  {
    key: "styleMd" as const,
    label: "Style",
    hint: "How she texts — cadence, slang, emoji, horniness level.",
  },
  {
    key: "rulesMd" as const,
    label: "Rules",
    hint: "Hard boundaries and behavioral constraints.",
  },
  {
    key: "contextMd" as const,
    label: "Context",
    hint: "Light lore / backstory that can evolve.",
  },
];

export function PersonaDetail({
  persona,
  appUrl,
}: {
  persona: Persona;
  appUrl: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(persona.intensity);
  const [name, setName] = useState(persona.name);
  const [docs, setDocs] = useState({
    soulMd: persona.soulMd,
    styleMd: persona.styleMd,
    rulesMd: persona.rulesMd,
    contextMd: persona.contextMd,
  });
  const [editingDocs, setEditingDocs] = useState(false);
  const [savingDocs, setSavingDocs] = useState(false);
  const [openDoc, setOpenDoc] = useState<
    "soulMd" | "styleMd" | "rulesMd" | "contextMd" | null
  >("soulMd");

  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [botLabel, setBotLabel] = useState("");

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["selfie"]);
  const [photos, setPhotos] = useState(persona.photos);
  const [bots, setBots] = useState(persona.bots);

  async function revealOrCreateKey() {
    const method = persona.hasApiKey || apiKey ? "GET" : "POST";
    const res = await fetch(`/api/characters/${persona.id}/apikey`, {
      method,
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "API key error");
      return;
    }
    if (!data.apiKey && method === "GET") {
      const created = await fetch(`/api/characters/${persona.id}/apikey`, {
        method: "POST",
      });
      const d = await created.json();
      if (!created.ok) {
        setMessage(d.error ?? "Could not create key");
        return;
      }
      setApiKey(d.apiKey);
      setMessage("API key created — copy it now");
      return;
    }
    setApiKey(data.apiKey);
    setMessage("API key loaded");
  }

  async function rotateKey() {
    if (!confirm("Rotate API key? Old key stops working.")) return;
    const res = await fetch(`/api/characters/${persona.id}/apikey`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error");
      return;
    }
    setApiKey(data.apiKey);
    setMessage("New API key — copy it now");
  }

  async function saveIntensity(value: number) {
    setIntensity(value);
    await fetch(`/api/characters/${persona.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intensity: value }),
    });
  }

  async function saveDefinition() {
    setSavingDocs(true);
    setMessage(null);
    const res = await fetch(`/api/characters/${persona.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || persona.name,
        soulMd: docs.soulMd,
        styleMd: docs.styleMd,
        rulesMd: docs.rulesMd,
        contextMd: docs.contextMd,
      }),
    });
    const data = await res.json();
    setSavingDocs(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not save definition");
      return;
    }
    setEditingDocs(false);
    setMessage("Persona definition saved");
    router.refresh();
  }

  function cancelEditDocs() {
    setName(persona.name);
    setDocs({
      soulMd: persona.soulMd,
      styleMd: persona.styleMd,
      rulesMd: persona.rulesMd,
      contextMd: persona.contextMd,
    });
    setEditingDocs(false);
  }

  async function addBot() {
    if (!botToken.trim() || !botUsername.trim()) {
      setMessage("Token and username required");
      return;
    }
    const res = await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: botToken.trim(),
        username: botUsername.trim(),
        characterId: persona.id,
        label: botLabel.trim() || undefined,
        setWebhook: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Bot error");
      return;
    }
    setBotToken("");
    setBotUsername("");
    setBotLabel("");
    setMessage(
      data.warning ?? `Bot @${data.bot.username} linked + webhook set`,
    );
    router.refresh();
    setBots((b) => [
      {
        id: data.bot.id,
        username: data.bot.username,
        active: true,
        label: botLabel || null,
        peerCount: 0,
        tokenMasked: "…",
      },
      ...b,
    ]);
  }

  async function removeBot(botId: string) {
    if (!confirm("Remove this bot?")) return;
    const res = await fetch(`/api/bots?botId=${botId}`, { method: "DELETE" });
    if (res.ok) {
      setBots((b) => b.filter((x) => x.id !== botId));
      setMessage("Bot removed");
    }
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function addPhoto() {
    if (!photoUrl.trim() || !selectedTags.length) {
      setMessage("URL and at least one tag required");
      return;
    }
    const res = await fetch(`/api/characters/${persona.id}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: photoUrl.trim(),
        caption: photoCaption.trim() || null,
        kind: selectedTags[0],
        tags: selectedTags,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Photo error");
      return;
    }
    setPhotos((p) => [data.photo, ...p]);
    setPhotoUrl("");
    setPhotoCaption("");
    setSelectedTags(["selfie"]);
    setMessage("Photo added");
  }

  async function removePhoto(photoId: string) {
    const res = await fetch(
      `/api/characters/${persona.id}/photos?photoId=${photoId}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setPhotos((p) => p.filter((x) => x.id !== photoId));
      setMessage("Photo removed");
    }
  }

  async function deletePersona() {
    if (!confirm(`Delete ${persona.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/characters/${persona.id}`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/personas");
  }

  const curlExample = `curl -X POST ${appUrl || "https://YOUR_APP"}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: ${apiKey || "YOUR_KEY"}" \\
  -d '{"message":"hey","peerId":"user-123"}'`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/personas"
            className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            ← Personas
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--ink)]">
            {persona.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {persona.relationshipCount} peer relationship
            {persona.relationshipCount === 1 ? "" : "s"} ·{" "}
            {bots.reduce((n, b) => n + b.peerCount, 0)} Telegram peers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/chat?characterId=${persona.id}`}
            className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm hover:border-[var(--accent)]"
          >
            Test chat
          </Link>
          <Link
            href={`/personas/${persona.id}/memory`}
            className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm hover:border-[var(--accent)]"
          >
            Memory
          </Link>
        </div>
      </div>

      {message ? (
        <p className="text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      <MagicCard>
        <section className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Definition
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Full Meuxe layers used by the character engine.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {editingDocs ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEditDocs}
                    disabled={savingDocs}
                    className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveDefinition()}
                    disabled={savingDocs}
                    className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {savingDocs ? "Saving…" : "Save definition"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingDocs(true)}
                  className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm hover:border-[var(--accent)]"
                >
                  Edit manually
                </button>
              )}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-[var(--muted)]">
            Intensity
            <input
              type="range"
              min={1}
              max={5}
              value={intensity}
              onChange={(e) => saveIntensity(Number(e.target.value))}
            />
            <span className="text-[var(--ink)]">{intensity}</span>
          </label>

          {editingDocs ? (
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--muted)]">Display name</span>
              <input
                className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          ) : null}

          <div className="space-y-2">
            {DOC_FIELDS.map((field) => {
              const open = openDoc === field.key;
              const value = docs[field.key];
              return (
                <div
                  key={field.key}
                  className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/50"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() => setOpenDoc(open ? null : field.key)}
                  >
                    <span>
                      <span className="font-medium text-[var(--ink)]">
                        {field.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">
                        {field.hint}
                      </span>
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {open ? "Hide" : "Show"} · {value.length} chars
                    </span>
                  </button>
                  {open ? (
                    <div className="border-t border-[var(--line)] px-4 py-3">
                      {editingDocs ? (
                        <textarea
                          className="min-h-48 w-full resize-y border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-sm leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                          value={value}
                          onChange={(e) =>
                            setDocs((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--ink)]">
                          {value.trim() || (
                            <span className="text-[var(--muted)]">Empty</span>
                          )}
                        </pre>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </MagicCard>

      <MagicCard>
      <section className="space-y-3 p-5">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
          Telegram bots
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Link N BotFather tokens to this persona. Each person who texts a bot
          gets an isolated memory with her.
        </p>
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder="Bot token"
        />
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={botUsername}
          onChange={(e) => setBotUsername(e.target.value)}
          placeholder="Username (without @)"
        />
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={botLabel}
          onChange={(e) => setBotLabel(e.target.value)}
          placeholder="Label (optional)"
        />
        <button
          type="button"
          onClick={addBot}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 font-medium text-white"
        >
          Add bot + webhook
        </button>
        <ul className="space-y-2 text-sm">
          {bots.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 p-3"
            >
              <a
                className="text-[var(--accent)]"
                href={`https://t.me/${b.username}`}
                target="_blank"
                rel="noreferrer"
              >
                @{b.username}
              </a>
              <span className="text-[var(--muted)]">
                {b.peerCount} peers
                {b.label ? ` · ${b.label}` : ""}
                {!b.active ? " · OFF" : ""}
              </span>
              <button
                type="button"
                className="ml-auto text-xs text-red-400"
                onClick={() => removeBot(b.id)}
              >
                Remove
              </button>
            </li>
          ))}
          {!bots.length ? (
            <li className="text-[var(--muted)]">No bots linked yet.</li>
          ) : null}
        </ul>
      </section>
      </MagicCard>

      <MagicCard>
      <section className="space-y-3 p-5">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
          Chat API
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Talk to this persona from any app. Use a stable{" "}
          <code className="text-[var(--ink)]">peerId</code> per end-user for
          isolated memory.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={revealOrCreateKey}
            className="border border-[var(--line)] px-4 py-2 text-sm"
          >
            {persona.hasApiKey || apiKey ? "Show API key" : "Create API key"}
          </button>
          <button
            type="button"
            onClick={rotateKey}
            className="border border-[var(--line)] px-4 py-2 text-sm"
          >
            Rotate key
          </button>
        </div>
        {apiKey ? (
          <p className="break-all rounded border border-[var(--line)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--ink)]">
            {apiKey}
          </p>
        ) : null}
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-xs text-[var(--muted)]">
          {curlExample}
        </pre>
      </section>
      </MagicCard>

      <MagicCard>
      <section className="space-y-3 p-5">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
          Photos + tags
        </h2>
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://…/photo.jpg"
        />
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          value={photoCaption}
          onChange={(e) => setPhotoCaption(e.target.value)}
          placeholder="Optional caption"
        />
        <div className="flex flex-wrap gap-2">
          {PHOTO_TAG_OPTIONS.map((t) => {
            const on = selectedTags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={
                  on
                    ? "border border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 text-xs"
                    : "border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]"
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addPhoto}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 font-medium text-white"
        >
          Add photo
        </button>
        <ul className="grid gap-2 sm:grid-cols-2">
          {photos.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
              <span className="flex-1 text-xs text-[var(--muted)]">
                {(p.tags?.length ? p.tags : [p.kind]).join(", ")}
              </span>
              <button
                type="button"
                className="text-xs text-[var(--danger)]"
                onClick={() => removePhoto(p.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
      </MagicCard>

      <button
        type="button"
        onClick={deletePersona}
        className="text-sm text-[var(--danger)] underline"
      >
        Delete persona
      </button>
    </div>
  );
}
