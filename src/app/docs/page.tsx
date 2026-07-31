import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chat API docs",
  description:
    "Public Chat API for Vesperer personas: authenticate with X-Api-Key, send messages, isolate memory per peer.",
  alternates: { canonical: `${SITE_URL}/docs` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TechArticle",
      name: `${SITE_NAME} Chat API`,
      description:
        "Authenticate with X-Api-Key and POST messages to /api/v1/chat with peer-isolated memory.",
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
          Developers
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Chat API
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
          Call a persona from your product. Auth is a per-character API key.
          Memory is isolated per <code className="text-[var(--ink)]">peerId</code>.
        </p>

        <section className="mt-12 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            1. Create an API key
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Sign in → Personas → open a character → generate an API key. Accept
            the platform operator attestation if prompted (required for channels
            and API).
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            2. Send a message
          </h2>
          <p className="text-sm text-[var(--muted)]">
            <code className="text-[var(--ink)]">POST {SITE_URL}/api/v1/chat</code>
          </p>
          <pre className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed text-[var(--ink)]">
{`curl -X POST ${SITE_URL}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: YOUR_KEY" \\
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
            Request body
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
                Optional stable id for the end-user (aliases: userId). Isolates
                memory. Default: <code>default</code>.
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
                Required <code>true</code> when the persona is adult / After
                Dark — your app must collect 18+ attestation first.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Auth
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Send <code className="text-[var(--ink)]">X-Api-Key: …</code> or{" "}
            <code className="text-[var(--ink)]">Authorization: Bearer …</code>{" "}
            with the character API key.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Telegram
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            No code required: paste a BotFather token on the persona. Webhooks
            and peer memory are configured for you. Details in{" "}
            <Link href="/help" className="text-[var(--accent)] hover:underline">
              Help
            </Link>
            .
          </p>
        </section>

        <section className="mt-14 rounded-2xl border border-[var(--line)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Next steps
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/#create"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Create a character
            </Link>
            <Link
              href="/technology"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              How identity & memory work
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
