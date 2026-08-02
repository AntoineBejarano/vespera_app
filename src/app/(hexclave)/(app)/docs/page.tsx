import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "API & CLI docs",
  description:
    "Vesperer CLI and APIs for AI agents: account keys (vsk_) and persona keys (vesp_).",
  robots: { index: false, follow: false },
};

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="API & CLI"
        description="Two keys. Account keys create personas. Persona keys chat with customers. Built so coding agents can provision characters without a browser."
        actions={
          <Link
            href="/settings"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Create API key
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border text-sm">
        <div className="grid grid-cols-[7rem_1fr] border-b border-border">
          <div className="border-r border-border px-3 py-2 font-medium">
            vsk_…
          </div>
          <div className="px-3 py-2 text-muted-foreground">
            Account API key — Settings → create. Used by CLI /{" "}
            <code>/api/v1/personas</code>
          </div>
        </div>
        <div className="grid grid-cols-[7rem_1fr]">
          <div className="border-r border-border px-3 py-2 font-medium">
            vesp_…
          </div>
          <div className="px-3 py-2 text-muted-foreground">
            Persona chat key — returned on create. Used by{" "}
            <code>/api/v1/chat</code>
          </div>
        </div>
      </div>

      <section id="cli" className="scroll-mt-24 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          CLI for AI agents
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          1) Settings → <strong className="text-foreground">Create key</strong>{" "}
          → copy <code className="text-foreground">vsk_…</code>
          <br />
          2) Login and create a persona from JSON (soul / style / rules /
          context = your business knowledge).
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed">
{`# From the Vesperer repo
npm run vesperer -- login --key vsk_YOUR_SECRET

# persona.json — direct layers (best for AIs)
# { "name":"Alex", "soul":"…", "style":"…", "rules":"…", "context":"…" }

npm run vesperer -- personas create --from persona.json
npm run vesperer -- personas list --json
npm run vesperer -- personas get <id>
npm run vesperer -- personas update <id> --soul ./soul.md
npm run vesperer -- knowledge packs link <packId> --character <id>`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Full vibecode walkthrough for Claude Code:{" "}
          <Link
            href="/integrations/claude"
            className="text-foreground underline underline-offset-2"
          >
            /integrations/claude
          </Link>
          .
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed">
{`curl -X POST ${SITE_URL}/api/v1/personas \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: vsk_YOUR_SECRET" \\
  -d '{
    "name": "Alex",
    "soul": "Who they are and what they value…",
    "style": "How they speak…",
    "rules": "Hard boundaries…",
    "context": "Product knowledge, policies, pricing…",
    "intensity": 2
  }'`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Response includes <code className="text-foreground">chatApiKey</code>{" "}
          <code className="text-foreground">(vesp_…)</code> for the chat
          endpoint below. Optional{" "}
          <code className="text-foreground">mode: &quot;generate&quot;</code>{" "}
          uses onboarding fields and expands layers with the LLM.
        </p>
      </section>

      <section id="api" className="scroll-mt-24 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          Account API surface
        </h2>
        <p className="text-sm text-muted-foreground">
          All management routes require{" "}
          <code className="text-foreground">X-Api-Key: vsk_…</code>. Every query
          is scoped to your workspace. Foreign IDs return 404.
        </p>
        <div className="overflow-hidden rounded-xl border border-border text-sm">
          {[
            ["GET", "/api/v1/personas", "List your personas"],
            ["POST", "/api/v1/personas", "Create (direct or generate)"],
            ["GET", "/api/v1/personas/:id", "Get layers (no chat key)"],
            ["PATCH", "/api/v1/personas/:id", "Update layers / flags"],
            ["DELETE", "/api/v1/personas/:id", "Delete persona"],
            ["POST", "/api/v1/personas/import", "Import Character Card"],
            ["GET/POST", "/api/v1/personas/:id/chat-key", "Reveal / rotate vesp_"],
            ["GET/POST", "/api/v1/knowledge/packs", "List / create packs"],
            ["POST", "/api/v1/knowledge/packs/:id/links", "Link to your personas"],
            ["GET/POST", "/api/v1/bots", "List / bind Telegram bots"],
            ["POST", "/api/v1/chat", "Chat with vesp_ (not vsk_)"],
          ].map(([method, path, desc]) => (
            <div
              key={`${method}-${path}`}
              className="grid grid-cols-[5.5rem_1fr] border-b border-border last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1.2fr)_1fr]"
            >
              <div className="border-r border-border px-3 py-2 font-mono text-xs font-medium">
                {method}
              </div>
              <div className="border-r border-border px-3 py-2 font-mono text-xs max-sm:col-span-1">
                {path}
              </div>
              <div className="px-3 py-2 text-muted-foreground max-sm:col-span-2 max-sm:border-t max-sm:border-border">
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="chat" className="scroll-mt-24 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          Chat API
        </h2>
        <p className="text-sm text-muted-foreground">
          <code className="text-foreground">POST {SITE_URL}/api/v1/chat</code>
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed">
{`curl -X POST ${SITE_URL}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: vesp_PERSONA_CHAT_KEY" \\
  -d '{
    "message": "Do you offer refunds?",
    "peerId": "customer_123",
    "displayName": "Alex",
    "endUserAgeAttested": true
  }'`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          Chat request body
        </h2>
        <div className="overflow-hidden rounded-xl border border-border text-sm">
          {[
            ["message", "Required. User message text."],
            ["peerId", "Optional stable id for the end-user. Isolates memory."],
            ["displayName", "Optional name for relationship context."],
            [
              "endUserAgeAttested",
              "Required true for adult / After Dark personas.",
            ],
          ].map(([field, desc]) => (
            <div
              key={field}
              className="grid grid-cols-[8rem_1fr] border-b border-border last:border-b-0"
            >
              <div className="border-r border-border px-3 py-2 font-medium">
                {field}
              </div>
              <div className="px-3 py-2 text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          Telegram
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Bind a BotFather token via CLI or{" "}
          <code className="text-foreground">POST /api/v1/bots</code> (requires
          operator attestation). See{" "}
          <Link href="/help" className="underline underline-offset-2">
            Help
          </Link>
          .
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed">
{`npm run vesperer -- bots create \\
  --token 123456:ABC… \\
  --username my_bot \\
  --character <personaId> \\
  --accept-operator`}
        </pre>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Link
          href="/settings"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Create account API key
        </Link>
        <Link
          href="/help"
          className="rounded-lg border border-border px-4 py-2 text-sm"
        >
          Help & FAQ
        </Link>
        <Link
          href="/personas"
          className="rounded-lg border border-border px-4 py-2 text-sm"
        >
          Personas
        </Link>
      </div>
    </div>
  );
}
