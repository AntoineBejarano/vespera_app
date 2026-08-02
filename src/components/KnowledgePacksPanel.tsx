"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProviderMeta = { id: string; label: string; description: string };
type SeedMeta = {
  key: string;
  name: string;
  description: string;
  language: string;
  sourceCount: number;
};

type SourceRow = {
  id: string;
  provider: string;
  externalId: string;
  canonicalUrl: string | null;
  license: string | null;
  language: string;
  status: string;
  enabled: boolean;
  documentCount: number;
  chunkCount: number;
  lastError: string | null;
  lastIngestedAt: string | null;
  checksum: string | null;
  datasetRevision: string | null;
  provenanceJson?: {
    attribution?: string;
    notes?: string;
    homepage?: string;
    license?: string;
  } | null;
};

type JobRow = {
  id: string;
  sourceId: string | null;
  kind: string;
  status: string;
  progress: number;
  documentsDone: number;
  documentsTotal: number;
  chunksDone: number;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
};

type PackRow = {
  id: string;
  name: string;
  description: string | null;
  language: string;
  active: boolean;
  seedKey: string | null;
  documentCount: number;
  chunkCount: number;
  sources: SourceRow[];
  characters: Array<{
    character: { id: string; name: string };
  }>;
  jobs: JobRow[];
};

type CharacterOpt = { id: string; name: string };

const PROVIDER_DEFAULTS: Record<string, Record<string, unknown>> = {
  generic_url: { url: "", format: "auto" },
  huggingface: {
    datasetId: "",
    split: "train",
    streaming: true,
    textColumn: "text",
    titleColumn: "title",
    metadataColumns: [],
    limit: 100,
  },
  gutenberg: { ebookId: "", format: "txt", language: "en" },
  mediawiki: {
    host: "en.wikisource.org",
    pageTitle: "",
    language: "en",
    includeSubpages: false,
  },
  object_storage: { objectKey: "", format: "auto" },
  user_owned: {
    kind: "manual",
    content: "",
    title: "",
    language: "en",
  },
};

export function KnowledgePacksPanel({
  characterId,
}: {
  characterId?: string;
}) {
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [providers, setProviders] = useState<ProviderMeta[]>([]);
  const [seeds, setSeeds] = useState<SeedMeta[]>([]);
  const [characters, setCharacters] = useState<CharacterOpt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState("gutenberg");
  const [configText, setConfigText] = useState(
    JSON.stringify(PROVIDER_DEFAULTS.gutenberg, null, 2),
  );
  const [inspection, setInspection] = useState<{
    sampleTitles?: string[];
    license?: string;
    provenance?: Record<string, unknown>;
    unchanged?: boolean;
    documentCount?: number;
  } | null>(null);
  const [newPackName, setNewPackName] = useState("");
  const [linkIds, setLinkIds] = useState<string[]>(
    characterId ? [characterId] : [],
  );

  const selected = packs.find((p) => p.id === selectedId) ?? packs[0] ?? null;

  async function load() {
    const res = await fetch("/api/knowledge/packs");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error loading packs");
      return;
    }
    setPacks(data.packs ?? []);
    setProviders(data.providers ?? []);
    setSeeds(data.seeds ?? []);
    if (!selectedId && data.packs?.[0]?.id) {
      setSelectedId(data.packs[0].id);
    }
  }

  async function loadCharactersForPack(packId: string) {
    const res = await fetch(`/api/knowledge/packs/${packId}/links`);
    const data = await res.json();
    if (res.ok) {
      setCharacters(data.characters ?? []);
      const linked = (data.links ?? []).map(
        (l: { character: { id: string } }) => l.character.id,
      );
      // Prefer real links; if opened from a persona with none yet, pre-select that persona.
      setLinkIds(
        linked.length
          ? linked
          : characterId
            ? [characterId]
            : [],
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (selected?.id) void loadCharactersForPack(selected.id);
  }, [selected?.id]);

  // Poll while jobs are active
  useEffect(() => {
    const active = packs.some((p) =>
      p.jobs.some((j) => j.status === "queued" || j.status === "running"),
    );
    if (!active) return;
    const t = setInterval(() => void load(), 2500);
    return () => clearInterval(t);
  }, [packs]);

  async function createEmpty() {
    if (!newPackName.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/knowledge/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPackName.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create pack");
      return;
    }
    setNewPackName("");
    setSelectedId(data.pack.id);
    await load();
  }

  async function createFromSeed(seedKey: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/knowledge/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seedKey }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create from seed");
      return;
    }
    setSelectedId(data.pack.id);
    await load();
    if (characterId) {
      await fetch(`/api/knowledge/packs/${data.pack.id}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterIds: [characterId] }),
      });
      await load();
    }
  }

  async function addSource() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setInspection(null);
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(configText) as Record<string, unknown>;
    } catch {
      setBusy(false);
      setError("Config must be valid JSON");
      return;
    }
    const res = await fetch(`/api/knowledge/packs/${selected.id}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, config }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add source");
      return;
    }
    setInspection({
      sampleTitles: data.inspection?.sampleTitles,
      license: data.inspection?.license,
      provenance: data.inspection?.provenance,
      unchanged: data.inspection?.unchanged,
      documentCount: data.inspection?.documentCount,
    });
    await load();
  }

  async function sourceAction(
    sourceId: string,
    action: "inspect" | "ingest" | "reingest" | "delete_vectors",
  ) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/knowledge/sources/${sourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        force: action === "reingest",
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    if (data.inspection) {
      setInspection({
        sampleTitles: data.inspection.sampleTitles,
        license: data.inspection.license,
        provenance: data.inspection.provenance,
        unchanged: data.inspection.unchanged,
        documentCount: data.inspection.documentCount,
      });
    }
    await load();
  }

  async function toggleSource(sourceId: string, enabled: boolean) {
    const res = await fetch(`/api/knowledge/sources/${sourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not update source");
      return;
    }
    await load();
  }

  async function jobAction(jobId: string, action: "cancel" | "retry") {
    const res = await fetch(`/api/knowledge/jobs/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Job action failed");
      return;
    }
    await load();
  }

  async function reindexPack() {
    if (!selected) return;
    setBusy(true);
    const res = await fetch(`/api/knowledge/packs/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reindex: true }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Reindex failed");
      return;
    }
    await load();
  }

  async function saveLinks() {
    if (!selected) return;
    setBusy(true);
    const res = await fetch(`/api/knowledge/packs/${selected.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterIds: linkIds, replace: true }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not assign personas");
      return;
    }
    await load();
    await loadCharactersForPack(selected.id);
  }

  async function onUpload(file: File) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("knowledgePackId", selected.id);
    const res = await fetch("/api/knowledge/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    setProvider("object_storage");
    setConfigText(
      JSON.stringify(
        {
          objectKey: data.objectKey,
          contentType: data.contentType,
          originalFilename: data.originalFilename,
          format: "auto",
        },
        null,
        2,
      ),
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Sources"
        description="Upload knowledge once, then assign which personas can use it. Chat only retrieves packs you assign — Tatiana can know Plato while Fernando does not."
        actions={
          characterId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/personas/${characterId}`}>← Back to persona</Link>
            </Button>
          ) : null
        }
      />

      {characterId ? (
        <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Assigning packs for this persona. Toggle names under{" "}
          <span className="font-medium text-foreground">Teach to personas</span>{" "}
          and save — or manage the same list from the persona&apos;s Agency tab.
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}

      <section className="mt-8 space-y-3 border-t border-border pt-6">
        <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Start from seed
        </h2>
        <div className="flex flex-wrap gap-3">
          {seeds.map((s) => (
            <button
              key={s.key}
              type="button"
              disabled={busy}
              onClick={() => void createFromSeed(s.key)}
              className="rounded-lg border border-border px-4 py-3 text-left hover:border-[var(--accent)] disabled:opacity-50"
            >
              <div className="font-medium text-foreground">{s.name}</div>
              <div className="mt-1 max-w-xs text-xs text-muted-foreground">
                {s.sourceCount} sources · {s.language}
              </div>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Input
            value={newPackName}
            onChange={(e) => setNewPackName(e.target.value)}
            placeholder="New pack name"
            className="min-w-[12rem] flex-1"
          />
          <Button
            type="button"
            disabled={busy || !newPackName.trim()}
            onClick={() => void createEmpty()}
          >
            Create pack
          </Button>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <h2 className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            Packs
          </h2>
          {packs.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No packs yet.</p>
          ) : (
            packs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selected?.id === p.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-[10px] opacity-70">
                  {p.chunkCount} chunks · {p.sources.length} sources
                  {p.characters.length
                    ? ` · ${p.characters.length} persona${p.characters.length === 1 ? "" : "s"}`
                    : " · unassigned"}
                </div>
              </button>
            ))
          )}
        </aside>

        {selected ? (
          <div className="space-y-8">
            <header>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {selected.name}
              </h2>
              {selected.description ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {selected.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-[var(--muted)]">
                {selected.documentCount} docs · {selected.chunkCount} chunks
                {selected.seedKey ? ` · seed:${selected.seedKey}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void reindexPack()}
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm hover:border-[var(--accent)]"
                >
                  Reindex pack
                </button>
              </div>
            </header>

            <section className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div>
                <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Teach to personas
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This pack is stored once. Only selected personas retrieve it in
                  chat. Leave someone off the list and they will not see it.
                </p>
              </div>
              {characters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Create a persona first, then assign this pack.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {characters.map((c) => {
                    const on = linkIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setLinkIds((prev) =>
                            on
                              ? prev.filter((x) => x !== c.id)
                              : [...prev, c.id],
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                        }`}
                      >
                        {on ? "✓ " : ""}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveLinks()}
                  size="sm"
                >
                  Save assignments
                </Button>
                <p className="text-xs text-muted-foreground">
                  {linkIds.length === 0
                    ? "Assigned to nobody"
                    : `Will teach ${linkIds.length} persona${linkIds.length === 1 ? "" : "s"}`}
                  {selected.characters.length
                    ? ` · currently: ${selected.characters.map((c) => c.character.name).join(", ")}`
                    : ""}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Sources
              </h3>
              {selected.sources.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No sources yet.</p>
              ) : (
                <ul className="space-y-3">
                  {selected.sources.map((s) => (
                    <li
                      key={s.id}
                      className="border border-[var(--line)] px-4 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-[var(--ink)]">
                            {s.provider} · {s.externalId}
                          </div>
                          <div className="mt-1 text-xs text-[var(--muted)]">
                            status:{s.status}
                            {s.enabled ? "" : " · disabled"} · docs:
                            {s.documentCount} · chunks:{s.chunkCount}
                            {s.license ? ` · ${s.license}` : ""}
                          </div>
                          {s.canonicalUrl ? (
                            <a
                              href={s.canonicalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block text-xs text-[var(--accent)] underline"
                            >
                              {s.canonicalUrl}
                            </a>
                          ) : null}
                          {s.lastError ? (
                            <p className="mt-1 text-xs text-[var(--danger)]">
                              {s.lastError}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                            onClick={() => void sourceAction(s.id, "inspect")}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                            onClick={() => void sourceAction(s.id, "ingest")}
                          >
                            Ingest
                          </button>
                          <button
                            type="button"
                            className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                            onClick={() => void sourceAction(s.id, "reingest")}
                          >
                            Retry
                          </button>
                          <button
                            type="button"
                            className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                            onClick={() =>
                              void toggleSource(s.id, !s.enabled)
                            }
                          >
                            {s.enabled ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                            onClick={() =>
                              void sourceAction(s.id, "delete_vectors")
                            }
                          >
                            Delete vectors
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {inspection ? (
              <section className="border border-[var(--line)] px-4 py-3 text-sm">
                <h3 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Preview / provenance
                </h3>
                <p className="mt-2 text-[var(--muted)]">
                  License: {inspection.license ?? "—"}
                  {inspection.unchanged ? " · unchanged since last ingest" : ""}
                  {inspection.documentCount != null
                    ? ` · ~${inspection.documentCount} docs`
                    : ""}
                </p>
                {inspection.sampleTitles?.length ? (
                  <ul className="mt-2 list-inside list-disc text-[var(--ink)]">
                    {inspection.sampleTitles.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : null}
                {inspection.provenance ? (
                  <pre className="mt-2 overflow-x-auto text-xs text-[var(--muted)]">
                    {JSON.stringify(inspection.provenance, null, 2)}
                  </pre>
                ) : null}
              </section>
            ) : null}

            <section className="space-y-3">
              <h3 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Add source
              </h3>
              <select
                value={provider}
                onChange={(e) => {
                  const id = e.target.value;
                  setProvider(id);
                  setConfigText(
                    JSON.stringify(PROVIDER_DEFAULTS[id] ?? {}, null, 2),
                  );
                }}
                className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
              >
                {(providers.length
                  ? providers
                  : Object.keys(PROVIDER_DEFAULTS).map((id) => ({
                      id,
                      label: id,
                      description: "",
                    }))
                ).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                rows={10}
                className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-xs"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void addSource()}
                >
                  Add & inspect
                </Button>
                <label className="cursor-pointer text-sm text-[var(--muted)] underline">
                  Upload file (R2 snapshot)
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onUpload(f);
                    }}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Jobs
              </h3>
              {selected.jobs.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No jobs yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {selected.jobs.map((j) => (
                    <li
                      key={j.id}
                      className="flex flex-wrap items-center justify-between gap-2 border border-[var(--line)] px-3 py-2"
                    >
                      <div>
                        <span className="text-[var(--ink)]">
                          {j.kind} · {j.status} · {j.progress}%
                        </span>
                        <div className="text-xs text-[var(--muted)]">
                          docs {j.documentsDone}/{j.documentsTotal || "?"} ·
                          chunks {j.chunksDone}
                          {j.error ? ` · ${j.error}` : ""}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {(j.status === "queued" || j.status === "running") && (
                          <button
                            type="button"
                            className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                            onClick={() => void jobAction(j.id, "cancel")}
                          >
                            Cancel
                          </button>
                        )}
                        {(j.status === "failed" ||
                          j.status === "cancelled") && (
                          <button
                            type="button"
                            className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                            onClick={() => void jobAction(j.id, "retry")}
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
