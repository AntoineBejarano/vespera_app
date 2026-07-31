"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useHexclaveApp, useUser } from "@hexclave/next";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { ShimmerButton } from "@/components/magicui/effects";
import {
  parseCharacterImport,
  type ImportSource,
  type ImportedCharacterDraft,
} from "@/lib/characters/import";

const DRAFT_KEY = "vesperer_import_draft_v1";

const SOURCES: { id: ImportSource; label: string; hint: string }[] = [
  {
    id: "character_card",
    label: "Upload a Character Card",
    hint: "Paste Character Card JSON (v2 / Tavern-style).",
  },
  {
    id: "prompt",
    label: "Paste a character prompt",
    hint: "System prompt, persona block, or description.",
  },
  {
    id: "json",
    label: "Import JSON",
    hint: "Any JSON with name, personality, scenario fields.",
  },
  {
    id: "conversations",
    label: "Upload conversations",
    hint: "Chat export text to reconstruct voice and history cues.",
  },
  {
    id: "description",
    label: "Rebuild from a description",
    hint: "A paragraph is enough to start.",
  },
  {
    id: "sillytavern",
    label: "SillyTavern",
    hint: "SillyTavern / TavernAI card JSON.",
  },
];

export function BringCharacterFlow() {
  const app = useHexclaveApp();
  const user = useUser({ or: "return-null" });
  const router = useRouter();
  const [source, setSource] = useState<ImportSource>("character_card");
  const [raw, setRaw] = useState("");
  const [permission, setPermission] = useState(false);
  const [preview, setPreview] = useState<ImportedCharacterDraft | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceMeta = useMemo(
    () => SOURCES.find((s) => s.id === source) ?? SOURCES[0],
    [source],
  );

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const data = JSON.parse(saved) as { raw?: string; source?: ImportSource };
      if (data.raw) setRaw(data.raw);
      if (data.source) setSource(data.source);
    } catch {
      /* ignore */
    }
  }, []);

  function runPreview() {
    setParseError(null);
    setError(null);
    try {
      const draft = parseCharacterImport(raw, source);
      setPreview(draft);
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ raw, source }));
    } catch (err) {
      setPreview(null);
      setParseError(err instanceof Error ? err.message : "Could not parse");
    }
  }

  async function importNow() {
    if (!permission) {
      setError("Confirm you have permission to use this character content.");
      return;
    }
    if (!preview) {
      runPreview();
      return;
    }
    if (!user) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ raw, source }));
      void app.redirectToSignUp();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/characters/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          source,
          permissionConfirmed: true,
          nameOverride: preview.name,
          intensity: preview.intensity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      sessionStorage.removeItem(DRAFT_KEY);
      router.push(`/personas/${data.character.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <AppNav variant="marketing" />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
          Bring a character
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Already created a character somewhere else?
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)]">
          Bring your character card, description, prompt or conversation
          history. Preserve what made the character special and continue from
          there.
        </p>

        <div className="mt-10 grid gap-2 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                source === s.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-[var(--muted)]">{sourceMeta.hint}</p>

        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={12}
          placeholder="Paste JSON, prompt, or description here…"
          className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-sm leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--accent)]"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runPreview}
            className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
          >
            Preview reconstruction
          </button>
          <ShimmerButton onClick={() => void importNow()}>
            {loading
              ? "Importing…"
              : user
                ? "Bring my character"
                : "Sign up to import"}
          </ShimmerButton>
        </div>

        <label className="mt-5 flex items-start gap-3 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={permission}
            onChange={(e) => setPermission(e.target.checked)}
            className="mt-1"
          />
          <span>
            Only import characters and content you created or have permission to
            use.
          </span>
        </label>

        {parseError ? (
          <p className="mt-4 text-sm text-[var(--danger)]">{parseError}</p>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
        ) : null}

        {preview ? (
          <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Preview
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
              {preview.name}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{preview.tagline}</p>
            <p className="mt-4 rounded-xl bg-[var(--bg)] px-4 py-3 text-sm">
              {preview.openingLine}
            </p>
            {preview.warnings.length ? (
              <ul className="mt-4 space-y-1 text-xs text-[var(--accent-2)]">
                {preview.warnings.map((w) => (
                  <li key={w}>· {w}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </main>
      <LegalFooter variant="marketing" />
    </div>
  );
}
