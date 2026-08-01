"use client";

import Link from "next/link";
import { ArrowUpRight, MessageSquare, Plus, Sparkles } from "lucide-react";
import { MagicCard } from "@/components/magicui/magic-card";
import { BlurFade } from "@/components/magicui/effects";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ShineBorder } from "@/components/ui/shine-border";

type Bot = {
  id: string;
  username: string;
  active: boolean;
  label: string | null;
  peerCount: number;
};

type Persona = {
  id: string;
  name: string;
  intensity: number;
  active: boolean;
  updatedAt: string;
  photoCount: number;
  coverUrl?: string | null;
  hasApiKey: boolean;
  bots: Bot[];
  peerCount: number;
};

export function PersonasList({ initial }: { initial: Persona[] }) {
  const liveCount = initial.filter((p) => p.active).length;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Personas"
        description="Identity, memory, bots and API — one roster for every channel."
        actions={
          <Button asChild size="lg">
            <Link href="/personas/new">
              <Plus className="size-4" />
              New persona
            </Link>
          </Button>
        }
      />

      {initial.length > 0 ? (
        <BlurFade delay={0.05}>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Personas" value={initial.length} />
            <StatCard label="Live" value={liveCount} />
            <StatCard
              label="Telegram peers"
              value={initial.reduce((n, p) => n + p.peerCount, 0)}
            />
          </div>
        </BlurFade>
      ) : null}

      {initial.length === 0 ? (
        <BlurFade delay={0.08}>
          <Card className="relative mt-10 overflow-hidden border-dashed bg-card/40 py-0">
            <ShineBorder
              shineColor={["#5badee", "#aed4fa", "#5badee"]}
              borderWidth={1}
              duration={12}
            />
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Sparkles className="size-5" />
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                Create your first persona
              </h2>
              <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
                Give her a mind, connect Telegram, and ship chat across channels.
              </p>
              <Button asChild className="mt-6" size="lg">
                <Link href="/personas/new">
                  <Plus className="size-4" />
                  Get started
                </Link>
              </Button>
            </CardContent>
          </Card>
        </BlurFade>
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {initial.map((p, i) => {
            const initialLetter = (p.name.trim()[0] || "?").toUpperCase();
            return (
              <BlurFade key={p.id} delay={0.04 + i * 0.03}>
                <li>
                  <MagicCard className="h-full rounded-2xl">
                    <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
                      <Link
                        href={`/personas/${p.id}`}
                        className="flex min-w-0 items-start gap-3"
                      >
                        <Avatar className="size-12 rounded-xl">
                          {p.coverUrl ? (
                            <AvatarImage src={p.coverUrl} alt="" />
                          ) : null}
                          <AvatarFallback className="rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                            {initialLetter}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
                              {p.name}
                            </h2>
                            {p.active ? (
                              <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                                Live
                              </Badge>
                            ) : null}
                            {p.hasApiKey ? (
                              <Badge variant="outline">API</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-xs text-[var(--muted)]">
                            Intensity {p.intensity}/5
                            {p.bots.length
                              ? ` · ${p.bots.map((b) => `@${b.username}`).join(", ")}`
                              : " · No bots yet"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge variant="secondary">
                              {p.peerCount} peers
                            </Badge>
                            <Badge variant="secondary">
                              {p.photoCount} photos
                            </Badge>
                          </div>
                        </div>
                        <ArrowUpRight className="mt-1 size-4 shrink-0 text-[var(--muted)]" />
                      </Link>
                      <div className="flex gap-2 border-t border-white/[0.06] pt-3">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/chat?characterId=${p.id}`}>
                            <MessageSquare className="size-3.5" />
                            Chat
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/personas/${p.id}/memory`}>Memory</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="ml-auto">
                          <Link href={`/personas/${p.id}`}>Open</Link>
                        </Button>
                      </div>
                    </div>
                  </MagicCard>
                </li>
              </BlurFade>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-white/[0.06] bg-card/50 py-0 shadow-none">
      <CardContent className="px-4 py-3.5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          {label}
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-[var(--ink)]">
          <NumberTicker value={value} />
        </p>
      </CardContent>
    </Card>
  );
}
