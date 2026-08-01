"use client";

import { useState } from "react";
import { MagicCard } from "@/components/magicui/magic-card";
import { BorderBeam } from "@/components/magicui/border-beam";
import { PlatformOperatorAck } from "@/components/PlatformOperatorAck";
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
      <p className="max-w-2xl text-sm text-[var(--muted)]">
        Every channel she lives on. Connect Telegram, wire the Chat API, or hand
        Claude a prompt so it installs itself via the Vesperer CLI.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Telegram */}
        <MagicCard>
          <section className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium text-[var(--ink)]">Telegram</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Link N BotFather tokens. Each peer gets isolated memory.
                </p>
              </div>
              <StatusDot on={bots.some((b) => b.active)} />
            </div>
            <input
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
              value={botToken}
              onChange={(e) => onBotTokenChange(e.target.value)}
              placeholder="Bot token"
            />
            <input
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
              value={botUsername}
              onChange={(e) => onBotUsernameChange(e.target.value)}
              placeholder="Username (without @)"
            />
            <input
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
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
            <button
              type="button"
              onClick={onAddBot}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)]"
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
                    onClick={() => onRemoveBot(b.id)}
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

        {/* Chat API / CLI */}
        <MagicCard>
          <section className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium text-[var(--ink)]">Chat API / CLI</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Talk from any app. Stable{" "}
                  <code className="text-[var(--ink)]">peerId</code> = isolated
                  memory.
                </p>
              </div>
              <StatusDot on={hasApiKey || Boolean(apiKey)} />
            </div>
            {showOperatorAck ? (
              <PlatformOperatorAck
                checked={operatorAck}
                onChange={onOperatorAckChange}
                compact
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onRevealOrCreateKey}
                className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm"
              >
                {hasApiKey || apiKey ? "Show API key" : "Create API key"}
              </button>
              <button
                type="button"
                onClick={onRotateKey}
                className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm"
              >
                Rotate key
              </button>
            </div>
            {apiKey ? (
              <p className="break-all rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--ink)]">
                {apiKey}
              </p>
            ) : null}
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-xs text-[var(--muted)]">
              {curlExample}
            </pre>

            <ClaudePromptBlock prompt={claudePrompt} />
          </section>
        </MagicCard>

        {/* Coming soon */}
        {COMING_SOON.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-elevated)]/40 p-5 opacity-80"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium text-[var(--ink)]">{item.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.blurb}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Soon
              </span>
            </div>
            <BorderBeam
              size={60}
              duration={10}
              colorFrom="var(--accent)"
              colorTo="transparent"
            />
          </div>
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
  {
    name: "Generic webhook",
    blurb: "Push messages into her mind from any custom integration.",
  },
];

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={
        on
          ? "mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
          : "mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[var(--muted)]/40"
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
    <div className="mt-2 space-y-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
          Install with Claude
        </h3>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-xs hover:border-[var(--accent)]"
        >
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Paste into Claude Code — it will wire this persona using the Vesperer
        CLI.
      </p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--bg)] p-2.5 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
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
