"use client";

import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { BlurFade, RetroGrid, ShimmerButton } from "@/components/magicui/effects";
import {
  AnimatedSpan,
  Terminal,
  TerminalTyping,
} from "@/components/magicui/terminal";
import { useHexclaveApp } from "@hexclave/next";
import { redirectToAppSignUp } from "@/lib/auth/redirects";

const STEPS = [
  {
    n: "01",
    t: "Create a vsk_ key",
    d: "Sign up, pass the 18+ gate, then Settings → API keys. That account key is your agent credential — never share it in prompts you publish.",
  },
  {
    n: "02",
    t: "Describe the character in Claude",
    d: "Ask Claude to write soul, style, rules, and context as markdown layers. Those four files are the identity — not a disposable system prompt.",
  },
  {
    n: "03",
    t: "Provision with the CLI",
    d: "Claude runs vesperer personas create --from persona.json. You get a vesp_ chat key scoped to that persona only.",
  },
  {
    n: "04",
    t: "Attach knowledge & chat",
    d: "Link knowledge packs, rotate keys, update layers — all via the same account key. End-users chat with vesp_; memory stays isolated per peerId.",
  },
];

const CAPABILITIES = [
  { t: "Create & generate", d: "Direct layers or LLM expand from onboarding fields." },
  { t: "Get / update / delete", d: "Full lifecycle — Claude can iterate the persona like code." },
  { t: "Import cards", d: "SillyTavern / Character Card JSON with permission attestation." },
  { t: "Knowledge packs", d: "Create packs and link only to personas you own." },
  { t: "Chat keys", d: "Reveal or rotate vesp_ keys without exposing other tenants." },
  { t: "Per-peer memory", d: "peerId isolates relationships; rate limits protect abuse." },
];

const SECURITY = [
  {
    t: "Tenant isolation",
    d: "Every management call resolves your user from a hashed vsk_ key. Lookups always include userId — foreign IDs return 404, never leak.",
  },
  {
    t: "Key separation",
    d: "vsk_ manages. vesp_ chats. Account keys cannot call chat; chat keys cannot list or edit personas.",
  },
  {
    t: "Rate limits",
    d: "Per-user minute budgets on management, create, import, knowledge, and chat. Daily message caps still apply to peers.",
  },
  {
    t: "Safety gates",
    d: "Age verification, plan persona caps, operator attestation for publish/rotate, and prohibited-content blocks on import.",
  },
];

const FAQ = [
  {
    q: "Can Claude Code create a Vesperer persona?",
    a: "Yes. Give Claude your vsk_ key (via env or login), a persona.json with soul/style/rules/context, and it runs the CLI or POST /api/v1/personas. The response includes a vesp_ chat key.",
  },
  {
    q: "Is my data isolated from other users?",
    a: "Yes. Personas, knowledge packs, and links are scoped to your account. Chat peers are synthetic users hashed per (characterId, peerId) so memory never crosses customers or tenants.",
  },
  {
    q: "What can the CLI do today?",
    a: "Login, list/get/create/update/delete personas, import character cards, reveal/rotate chat keys, chat, and create/link knowledge packs — all over the production /api/v1 surface with rate limits.",
  },
  {
    q: "Do I need to open the Vesperer UI?",
    a: "Only to sign up, accept the age gate, and create the first vsk_ key. After that, Claude (or any agent) can provision and iterate characters headlessly.",
  },
  {
    q: "How do I vibecode a character from Claude?",
    a: "Prompt Claude to invent the four identity layers, write persona.json, run npm run vesperer -- personas create --from persona.json, then chat with the returned vesp_ key. Iterate with personas update.",
  },
];

function ClaudeTerminalDemo() {
  return (
    <Terminal title="claude · vesperer create">
      <TerminalTyping className="text-[var(--muted)]">
        $ export VESPERER_API_KEY=vsk_••••
      </TerminalTyping>

      <TerminalTyping>
        $ cat &gt; persona.json &lt;&lt;&apos;EOF&apos;
      </TerminalTyping>

      <AnimatedSpan className="text-[var(--muted)]">
        {`{ "name": "Alex", "soul": "Calm CS lead…",`}
      </AnimatedSpan>
      <AnimatedSpan className="text-[var(--muted)]">
        {`  "style": "Short, warm…", "rules": "Never invent policy…",`}
      </AnimatedSpan>
      <AnimatedSpan className="text-[var(--muted)]">
        {`  "context": "Refunds within 14 days…" }`}
      </AnimatedSpan>
      <AnimatedSpan className="text-[var(--muted)]">EOF</AnimatedSpan>

      <TerminalTyping>
        $ npm run vesperer -- personas create --from persona.json
      </TerminalTyping>

      <AnimatedSpan className="text-[var(--accent)]">
        ✔ Persona created · id cm…alex
      </AnimatedSpan>
      <AnimatedSpan className="text-[var(--muted)]">
        chatApiKey: vesp_•••• (scoped to this persona)
      </AnimatedSpan>

      <TerminalTyping>
        $ npm run vesperer -- knowledge packs link pk_… --character cm…alex
      </TerminalTyping>
      <AnimatedSpan className="text-[var(--accent)]">
        ✔ Pack linked · ownership verified
      </AnimatedSpan>

      <TerminalTyping>
        $ npm run vesperer -- chat --key vesp_•••• --message &quot;Refunds?&quot; --peer u_42 --age-attested
      </TerminalTyping>
      <AnimatedSpan className="text-[var(--ink)]">
        Unused seats refund within 14 days — want the link?
      </AnimatedSpan>
    </Terminal>
  );
}

export function IntegrationsClaudePage() {
  const app = useHexclaveApp();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <RetroGrid />
      </div>

      <AppNav variant="marketing" />

      <section className="relative mx-auto grid min-h-[88dvh] max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Integrations · Claude
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Vibecode a character from Claude.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
            Point Claude Code at the Vesperer CLI. It writes identity layers,
            provisions a persona, attaches knowledge, and chats — with
            production-grade tenant isolation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ShimmerButton onClick={() => redirectToAppSignUp(app)}>
              Get a free API key
            </ShimmerButton>
            <Link
              href="/handler/sign-in"
              className="rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm hover:border-[var(--accent)]"
            >
              Read the CLI docs
            </Link>
          </div>
          <p className="mt-6 text-sm text-[var(--muted)]">
            Works with Claude Code, Cursor agents, and any tool that can run a
            shell.
          </p>
        </BlurFade>

        <BlurFade delay={0.12}>
          <ClaudeTerminalDemo />
        </BlurFade>
      </section>

      <section className="relative border-y border-[var(--line)] bg-[var(--bg-elevated)]/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              From prompt to live persona
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
              One job per step. Claude stays in the terminal; Vesperer owns
              identity, memory, and keys.
            </p>
          </BlurFade>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <BlurFade key={s.n} delay={i * 0.05}>
                <article>
                  <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--accent)]">
                    {s.n}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {s.d}
                  </p>
                </article>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Everything an agent needs
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Full lifecycle over{" "}
            <code className="text-[var(--ink)]">/api/v1</code> — not a toy create
            endpoint.
          </p>
        </BlurFade>
        <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <BlurFade key={c.t} delay={i * 0.04}>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                {c.t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {c.d}
              </p>
            </BlurFade>
          ))}
        </div>
      </section>

      <section className="relative border-y border-[var(--line)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Built for production multi-tenancy
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
              Agents move fast. The API still enforces hard tenant boundaries.
            </p>
          </BlurFade>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {SECURITY.map((s, i) => (
              <BlurFade key={s.t} delay={i * 0.05}>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {s.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {s.d}
                </p>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            Copy-paste for Claude
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            Paste this into Claude Code after you have a{" "}
            <code className="text-[var(--ink)]">vsk_</code> key.
          </p>
        </BlurFade>
        <BlurFade delay={0.08}>
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed sm:p-5">
{`# 1) Auth (once)
export VESPERER_API_KEY=vsk_YOUR_SECRET
# or: npm run vesperer -- login --key vsk_YOUR_SECRET

# 2) Write layers (Claude invents these)
# persona.json → name, soul, style, rules, context

# 3) Create
npm run vesperer -- personas create --from persona.json

# 4) Iterate
npm run vesperer -- personas update <id> --soul ./soul.md

# 5) Knowledge (optional)
npm run vesperer -- knowledge packs create --name "Product FAQ"
npm run vesperer -- knowledge packs link <packId> --character <personaId>

# 6) Chat (use vesp_ from create — never vsk_)
npm run vesperer -- chat --key vesp_… --message "Hello" --peer demo --age-attested`}
          </pre>
        </BlurFade>
      </section>

      <section className="relative border-t border-[var(--line)] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
              FAQ
            </h2>
          </BlurFade>
          <div className="mt-8 space-y-8">
            {FAQ.map((f, i) => (
              <BlurFade key={f.q} delay={i * 0.04}>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  {f.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {f.a}
                </p>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-[var(--line)] py-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Open Claude. Ship a character.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
              Free Starter includes a persona. Create your key and let the agent
              do the rest.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ShimmerButton onClick={() => redirectToAppSignUp(app)}>
                Start free
              </ShimmerButton>
              <Link
                href="/settings"
                className="rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm"
              >
                Settings → API keys
              </Link>
              <Link
                href="/handler/sign-in"
                className="rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm"
              >
                Sign in for API docs
              </Link>
            </div>
          </BlurFade>
        </div>
      </section>

      <LegalFooter variant="marketing" />
    </div>
  );
}
