import Link from "next/link";
import { LEGAL_OPERATOR } from "@/lib/legal/constants";
import { LegalFooter } from "@/components/LegalFooter";

const CATEGORIES = [
  "Minor safety (under 18)",
  "Non-consensual or intimate-image abuse",
  "Impersonation or fraud",
  "Coercion, blackmail, or sextortion",
  "Illegal content",
  "Harassment or privacy violation",
  "Other safety concern",
] as const;

export const metadata = {
  title: "Report abuse — Vesperer",
  description: "Report illegal, exploitative, or harmful use of Vesperer.",
};

export default function ReportPage() {
  const { abuseEmail, brand } = LEGAL_OPERATOR;
  const subject = encodeURIComponent(`[${brand}] Safety report`);
  const body = encodeURIComponent(
    [
      "Category: (choose one)",
      ...CATEGORIES.map((c) => `- ${c}`),
      "",
      "Describe what happened (include URLs, bot usernames, or character slugs if known):",
      "",
      "",
      "Your contact email (optional):",
    ].join("\n"),
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--ink)]">
            ← Home
          </Link>
        </p>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Report abuse or illegal content
        </h1>
        <p className="mt-4 leading-relaxed text-[var(--muted)]">
          Vesperer has zero tolerance for sexual content involving minors,
          exploitation, non-consensual imagery, trafficking, coercion, and other
          illegal activity. Reports are reviewed as promptly as possible.
        </p>

        <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <h2 className="font-medium">Email a report</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Send details to{" "}
            <a
              href={`mailto:${abuseEmail}?subject=${subject}&body=${body}`}
              className="text-[var(--ink)] underline"
            >
              {abuseEmail}
            </a>
            . Include links, Telegram bot @usernames, or character URLs if you
            have them.
          </p>
          <a
            href={`mailto:${abuseEmail}?subject=${subject}&body=${body}`}
            className="mt-4 inline-block rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--bg)]"
          >
            Open email template
          </a>
        </div>

        <div className="mt-8 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
          <p>
            <strong className="text-[var(--ink)]">If someone is in immediate danger,</strong>{" "}
            contact local emergency services first — do not wait for us.
          </p>
          <p>
            Suspected child sexual abuse material may also be reportable to your
            national hotline (e.g. NCMEC CyberTipline in the US). We may preserve
            data and cooperate with law enforcement where legally required.
          </p>
          <p>
            See also{" "}
            <Link href="/legal/acceptable-use" className="underline">
              Acceptable Use Policy
            </Link>{" "}
            and{" "}
            <Link href="/legal/adult-content" className="underline">
              Adult Content Notice
            </Link>
            .
          </p>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
