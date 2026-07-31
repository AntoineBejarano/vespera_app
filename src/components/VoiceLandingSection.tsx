"use client";

import Link from "next/link";
import { VoiceAgentWidget } from "@/components/VoiceAgentWidget";
import { BlurFade } from "@/components/magicui/effects";

export function VoiceLandingSection() {
  return (
    <section
      id="voice"
      className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/30 py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Vesperer Voice
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            Voice AI for regulated, high-stakes conversations — that remembers.
          </h2>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            Like enterprise phone agents, but with a durable character layer:
            identity, long-term memory, and omnichannel continuity. Click to
            speak with an agent.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
            <li>· IVR replacement with natural language</li>
            <li>· Inbound & outbound voice agents</li>
            <li>· Unified memory across voice, chat, and channels</li>
            <li>· AI contact center workflows without forgotten callers</li>
          </ul>
          <Link
            href="/voice"
            className="mt-8 inline-flex rounded-xl border border-[var(--line)] px-5 py-3 text-sm hover:border-[var(--accent)]"
          >
            See the full voice platform →
          </Link>
        </BlurFade>
        <BlurFade delay={0.08}>
          <VoiceAgentWidget compact />
        </BlurFade>
      </div>
    </section>
  );
}
