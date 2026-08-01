"use client";

import { useEffect, useState } from "react";
import { PlatformOperatorAck } from "@/components/PlatformOperatorAck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PersonaBot } from "./types";

export function PersonaConnectionsTab({
  personaId,
  personaName,
  appUrl,
  bots,
  botToken,
  botUsername,
  botLabel,
  onBotTokenChange,
  onBotUsernameChange,
  onBotLabelChange,
  onAddBot,
  onRemoveBot,
  hasApiKey,
  apiKey,
  showOperatorAck,
  operatorAck,
  onOperatorAckChange,
  onRevealOrCreateKey,
  onRotateKey,
}: {
  personaId: string;
  personaName: string;
  appUrl: string;
  bots: PersonaBot[];
  botToken: string;
  botUsername: string;
  botLabel: string;
  onBotTokenChange: (v: string) => void;
  onBotUsernameChange: (v: string) => void;
  onBotLabelChange: (v: string) => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  hasApiKey: boolean;
  apiKey: string | null;
  showOperatorAck: boolean;
  operatorAck: boolean;
  onOperatorAckChange: (v: boolean) => void;
  onRevealOrCreateKey: () => void;
  onRotateKey: () => void;
}) {
  const base = appUrl || "https://vesperer.com";
  const curlExample = `curl -X POST ${base}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: ${apiKey || "YOUR_KEY"}" \\
  -d '{"message":"hey","peerId":"user-123","endUserAgeAttested":true}'`;

  const claudePrompt = buildClaudePrompt({
    personaId,
    personaName,
    appUrl: base,
    chatKey: apiKey,
  });

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Every channel she lives on. Connect Telegram, wire the Chat API, or hand
        Claude a prompt so it installs itself via the Vesperer CLI.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Telegram</CardTitle>
                <CardDescription>
                  Link N BotFather tokens. Each peer gets isolated memory.
                </CardDescription>
              </div>
              <StatusDot on={bots.some((b) => b.active)} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={botToken}
              onChange={(e) => onBotTokenChange(e.target.value)}
              placeholder="Bot token"
            />
            <Input
              value={botUsername}
              onChange={(e) => onBotUsernameChange(e.target.value)}
              placeholder="Username (without @)"
            />
            <Input
              value={botLabel}
              onChange={(e) => onBotLabelChange(e.target.value)}
              placeholder="Label (optional)"
            />
            {showOperatorAck ? (
              <PlatformOperatorAck
                checked={operatorAck}
                onChange={onOperatorAckChange}
                compact
              />
            ) : null}
            <Button type="button" onClick={onAddBot}>
              Add bot + webhook
            </Button>
            <ul className="space-y-2 text-sm">
              {bots.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/60 p-3"
                >
                  <a
                    className="text-[var(--accent)]"
                    href={`https://t.me/${b.username}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{b.username}
                  </a>
                  <span className="text-muted-foreground">
                    {b.peerCount} peers
                    {b.label ? ` · ${b.label}` : ""}
                    {!b.active ? " · OFF" : ""}
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="ml-auto h-auto px-0 text-destructive"
                    onClick={() => onRemoveBot(b.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
              {!bots.length ? (
                <li className="text-muted-foreground">No bots linked yet.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Chat API / CLI</CardTitle>
                <CardDescription>
                  Talk from any app. Stable{" "}
                  <code className="text-foreground">peerId</code> = isolated
                  memory.
                </CardDescription>
              </div>
              <StatusDot on={hasApiKey || Boolean(apiKey)} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showOperatorAck ? (
              <PlatformOperatorAck
                checked={operatorAck}
                onChange={onOperatorAckChange}
                compact
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onRevealOrCreateKey}
              >
                {hasApiKey || apiKey ? "Show API key" : "Create API key"}
              </Button>
              <Button type="button" variant="outline" onClick={onRotateKey}>
                Rotate key
              </Button>
            </div>
            {apiKey ? (
              <p className="break-all rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground">
                {apiKey}
              </p>
            ) : null}
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
              {curlExample}
            </pre>
            <ClaudePromptBlock prompt={claudePrompt} />
          </CardContent>
        </Card>

        <ObsidianConnectCard
          personaId={personaId}
          onSynced={(msg) => {
            window.dispatchEvent(
              new CustomEvent("persona-message", { detail: msg }),
            );
          }}
        />

        {COMING_SOON.map((item) => (
          <Card
            key={item.name}
            className="border-dashed bg-card/50 opacity-80 shadow-none"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.blurb}</CardDescription>
                </div>
                <Badge variant="outline" className="uppercase">
                  Soon
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

const COMING_SOON = [
  {
    name: "WhatsApp",
    blurb: "Business API channel with the same memory graph.",
  },
  {
    name: "Discord",
    blurb: "Server + DM presence with per-peer relationships.",
  },
];

function ObsidianConnectCard({
  personaId,
  onSynced,
}: {
  personaId: string;
  onSynced: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [pendingNotes, setPendingNotes] = useState<
    { path: string; title: string; content: string }[] | null
  >(null);
  const [preview, setPreview] = useState<
    import("@/lib/persona/mind-graph").ClassifiedNotePreview[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/characters/${personaId}/obsidian`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && typeof d.noteCount === "number") {
          setNoteCount(d.noteCount);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [personaId]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setLocalMsg(null);
    try {
      const { notesFromFiles, classifyVault } = await import(
        "@/lib/persona/obsidian-parse"
      );
      const notes = await notesFromFiles(files);
      if (!notes.length) {
        setLocalMsg("Drop a vault .zip or .md files (with [[wikilinks]]).");
        setBusy(false);
        return;
      }
      setPendingNotes(notes);
      setPreview(classifyVault(notes));
      setLocalMsg(
        `${notes.length} notes parsed — review classification, then import.`,
      );
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!pendingNotes?.length) return;
    setBusy(true);
    setLocalMsg(null);
    try {
      const res = await fetch(`/api/characters/${personaId}/obsidian`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: pendingNotes,
          ingest: true,
          replace: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setNoteCount(data.noteCount ?? pendingNotes.length);
      const msg = `Vault linked — ${data.noteCount} notes become structure in the mind graph (not blind memories).`;
      setLocalMsg(msg);
      onSynced(msg);
      setPendingNotes(null);
      setPreview(null);
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  const typeCounts =
    preview?.reduce<Record<string, number>>((acc, p) => {
      acc[p.type] = (acc[p.type] ?? 0) + 1;
      return acc;
    }, {}) ?? null;

  return (
    <Card className="shadow-none lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Connect Obsidian</CardTitle>
            <CardDescription>
              Your notes become memories, beliefs and connections — not just
              context. Upload a vault <code className="text-foreground">.zip</code>{" "}
              or <code className="text-foreground">.md</code> files; we classify
              before wiring the mind.
            </CardDescription>
          </div>
          <StatusDot on={Boolean(noteCount)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {noteCount != null ? (
          <p className="text-xs text-muted-foreground">
            {noteCount} notes in mind
          </p>
        ) : null}
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/60 px-4 py-8 text-center transition hover:border-[var(--accent)]">
          <span className="text-sm text-foreground">
            {busy ? "Working…" : "Drop vault .zip / .md files"}
          </span>
          <span className="mt-1 max-w-md text-xs text-muted-foreground">
            Phase 1: zip import. Phase 2 (soon): official “Vesperer for Obsidian”
            plugin with incremental sync.
          </span>
          <input
            type="file"
            accept=".md,.zip,text/markdown,application/zip"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => void onFiles(e.target.files)}
          />
        </label>

        {typeCounts ? (
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {Object.entries(typeCounts).map(([t, n]) => (
              <Badge key={t} variant="outline">
                {t}: {n}
              </Badge>
            ))}
          </div>
        ) : null}

        {preview?.length ? (
          <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-border bg-background/50 p-2">
            {preview.slice(0, 40).map((p) => (
              <div
                key={p.path}
                className="rounded-lg border border-border px-3 py-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{p.title}</span>
                  <span className="uppercase tracking-wider text-[var(--accent)]">
                    {p.type}
                    {p.private ? " · private" : ""}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">{p.reason}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {p.path} · {p.wikilinkCount} wikilinks ·{" "}
                  {Math.round(p.confidence * 100)}% confidence
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {pendingNotes ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => void confirmImport()}
            >
              Import into mind
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setPendingNotes(null);
                setPreview(null);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : null}

        {localMsg ? (
          <p className="text-xs text-[var(--accent)]">{localMsg}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={
        on
          ? "mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"
          : "mt-1 inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/40"
      }
      title={on ? "Connected" : "Not connected"}
    />
  );
}

function ClaudePromptBlock({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)]/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
          Install with Claude
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy prompt"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste into Claude Code — it will wire this persona using the Vesperer
        CLI.
      </p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
        {prompt}
      </pre>
    </div>
  );
}

function buildClaudePrompt({
  personaId,
  personaName,
  appUrl,
  chatKey,
}: {
  personaId: string;
  personaName: string;
  appUrl: string;
  chatKey: string | null;
}) {
  const keyHint = chatKey
    ? `Chat key (vesp_…): ${chatKey}`
    : "Chat key: ask the user to click “Show API key” / “Create API key” on the Connections tab and paste it here.";

  return `You are installing a Vesperer persona into this project via the official CLI.

Persona:
- Name: ${personaName}
- Persona ID: ${personaId}
- API base: ${appUrl}
- ${keyHint}

Steps:
1. If the repo has \`npm run vesperer\`, use it. Otherwise clone/use the Vesperer CLI docs.
2. For account-level ops, login with an account key (\`vsk_…\`):
   \`npm run vesperer -- login --key vsk_YOUR_ACCOUNT_KEY --url ${appUrl}\`
3. Inspect the persona:
   \`npm run vesperer -- personas get ${personaId}\`
4. Get or rotate the chat key if needed:
   \`npm run vesperer -- personas chat-key ${personaId}\`
5. Send a test message (age attested):
   \`npm run vesperer -- chat --key vesp_… --message "hey" --peer local-dev --age-attested\`
6. Wire the chat key into this project's env (e.g. VESPERER_CHAT_KEY) and call
   POST ${appUrl}/api/v1/chat with headers X-Api-Key and JSON
   { "message", "peerId", "endUserAgeAttested": true }.

Do not invent endpoints. Prefer the CLI. Confirm with the user before rotating keys.`;
}
