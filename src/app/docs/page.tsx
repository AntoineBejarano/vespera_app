import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "API & CLI docs",
  description:
    "Vesperer CLI and APIs for AI agents: create, update, delete personas, knowledge packs, and chat — account keys (vsk_) and persona keys (vesp_) with tenant isolation.",
  alternates: { canonical: `${SITE_URL}/docs` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TechArticle",
      name: `${SITE_NAME} API & CLI`,
      description:
        "Create personas via CLI or POST /api/v1/personas; chat via POST /api/v1/chat.",
      url: `${SITE_URL}/docs`,
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Docs", path: "/docs" },
    ]),
  ],
};

export default function DocsPage() {
  return (
    <div className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AppNav variant="marketing" />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
          Developers · AI agents
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          API & CLI
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
          Two keys. Account keys create personas. Persona keys chat with
          customers. Built so coding agents can provision characters without a
          browser.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] text-sm">
          <div className="grid grid-cols-[7rem_1fr] border-b border-[var(--line)]">
            <div className="border-r border-[var(--line)] px-3 py-2 font-medium">
              vsk_…
            </div>
            <div className="px-3 py-2 text-[var(--muted)]">
              Account API key — Settings → create. Used by CLI /{" "}
              <code>/api/v1/personas</code>
            </div>
          </div>
          <div className="grid grid-cols-[7rem_1fr]">
            <div className="border-r border-[var(--line)] px-3 py-2 font-medium">
              vesp_…
            </div>
            <div className="px-3 py-2 text-[var(--muted)]">
              Persona chat key — returned on create. Used by{" "}
              <code>/api/v1/chat</code>
            </div>
          </div>
        </div>

        <section id="cli" className="mt-14 scroll-mt-24 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            CLI for AI agents
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            1) Sign up → Settings → <strong>Create key</strong> → copy{" "}
            <code className="text-[var(--ink)]">vsk_…</code>
            <br />
            2) Login and create a persona from JSON (soul / style / rules /
            context = your business knowledge).
          </p>
          <pre className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed text-[var(--ink)]">
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
          <p className="text-sm text-[var(--muted)]">
            Full vibecode walkthrough for Claude Code:{" "}
            <Link
              href="/integrations/claude"
              className="text-[var(--accent)] hover:underline"
            >
              /integrations/claude
            </Link>
            .
          </p>
          <p className="text-sm text-[var(--muted)]">
            Same thing over HTTP if you prefer curl / your agent’s fetch:
          </p>
          <pre className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed text-[var(--ink)]">
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
          <p className="text-sm text-[var(--muted)]">
            Response includes <code className="text-[var(--ink)]">chatApiKey</code>{" "}
            (<code className="text-[var(--ink)]">(vesp_…)</code> for the chat
            endpoint below. Optional{" "}
            <code className="text-[var(--ink)]">mode: &quot;generate&quot;</code>{" "}
            uses onboarding fields and expands layers with the LLM.
          </p>
        </section>

        <section id="api" className="mt-14 scroll-mt-24 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Account API surface
          </h2>
          <p className="text-sm text-[var(--muted)]">
            All management routes require{" "}
            <code className="text-[var(--ink)]">X-Api-Key: vsk_…</code>. Every
            query is scoped to your user. Foreign IDs return 404. Rate limits
            apply per account.
          </p>
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] text-sm">
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
                className="grid grid-cols-[5.5rem_1fr] border-b border-[var(--line)] last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1.2fr)_1fr]"
              >
                <div className="border-r border-[var(--line)] px-3 py-2 font-mono text-xs font-medium">
                  {method}
                </div>
                <div className="border-r border-[var(--line)] px-3 py-2 font-mono text-xs text-[var(--ink)] max-sm:col-span-1 sm:border-r">
                  {path}
                </div>
                <div className="px-3 py-2 text-[var(--muted)] max-sm:col-span-2 max-sm:border-t max-sm:border-[var(--line)]">
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="chat" className="mt-14 scroll-mt-24 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Chat API
          </h2>
          <p className="text-sm text-[var(--muted)]">
            <code className="text-[var(--ink)]">POST {SITE_URL}/api/v1/chat</code>
          </p>
          <pre className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed text-[var(--ink)]">
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

        <section className="mt-10 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Chat request body
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] text-sm">
            <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--line)]">
              <div className="border-r border-[var(--line)] px-3 py-2 font-medium">
                message
              </div>
              <div className="px-3 py-2 text-[var(--muted)]">
                Required. User message text.
              </div>
            </div>
            <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--line)]">
              <div className="border-r border-[var(--line)] px-3 py-2 font-medium">
                peerId
              </div>
              <div className="px-3 py-2 text-[var(--muted)]">
                Optional stable id for the end-user. Isolates memory.
              </div>
            </div>
            <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--line)]">
              <div className="border-r border-[var(--line)] px-3 py-2 font-medium">
                displayName
              </div>
              <div className="px-3 py-2 text-[var(--muted)]">
                Optional name for relationship context.
              </div>
            </div>
            <div className="grid grid-cols-[8rem_1fr]">
              <div className="border-r border-[var(--line)] px-3 py-2 font-medium">
                endUserAgeAttested
              </div>
              <div className="px-3 py-2 text-[var(--muted)]">
                Required <code>true</code> for adult / After Dark personas.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Telegram
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Bind a BotFather token via CLI or{" "}
            <code className="text-[var(--ink)]">POST /api/v1/bots</code>{" "}
            (requires operator attestation). Webhooks and peer memory are
            configured for you. Tokens are never returned in full after create —
            only masked. See{" "}
            <Link href="/help" className="text-[var(--accent)] hover:underline">
              Help
            </Link>
            .
          </p>
          <pre className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed text-[var(--ink)]">
{`npm run vesperer -- bots create \\
  --token 123456:ABC… \\
  --username my_bot \\
  --character <personaId> \\
  --accept-operator`}
          </pre>
        </section>

        <section className="mt-14 rounded-2xl border border-[var(--line)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Next steps
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/settings"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Create account API key
            </Link>
            <Link
              href="/integrations/claude"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Claude · vibecode
            </Link>
            <Link
              href="/#cli"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Landing · CLI
            </Link>
            <Link
              href="/help"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Help & FAQ
            </Link>
          </div>
        </section>
      </main>
      <LegalFooter variant="marketing" />
    </div>
  );
}
