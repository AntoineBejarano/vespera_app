"use client";

import Link from "next/link";
import { VoiceAgentWidget } from "@/components/VoiceAgentWidget";
import { BlurFade } from "@/components/magicui/effects";
import type { VoiceAgentId } from "@/lib/voice/types";

export function VoiceLandingSection({
  defaultAgent = "einstein",
}: {
  defaultAgent?: VoiceAgentId;
}) {
  return (
    <section
      id="voice"
      className="scroll-mt-24 border-y border-[var(--line)] bg-[var(--bg-elevated)]/30 py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Vesperer Voice
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            Choose who answers.
          </h2>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            Speak or type. The same identity and memories continue across chat
            and voice.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
            <li>· Luna · Einstein · Stoic Mentor</li>
            <li>· Same memories across chat and voice</li>
            <li>· The conversation continues wherever you return</li>
            <li>· No account needed for the demo</li>
          </ul>
          <Link
            href="/voice"
            className="mt-8 inline-flex rounded-xl border border-[var(--line)] px-5 py-3 text-sm hover:border-[var(--accent)]"
          >
            Explore voice →
          </Link>
        </BlurFade>
        <BlurFade delay={0.08}>
          <VoiceAgentWidget
            compact
            catalog="sfw"
            defaultAgent={defaultAgent}
          />
        </BlurFade>
      </div>
    </section>
  );
}
