"use client";

import Link from "next/link";
import { MessageSquare, Plus, Sparkles } from "lucide-react";
import { MagicCard } from "@/components/magicui/magic-card";
import { BlurFade } from "@/components/magicui/effects";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShineBorder } from "@/components/ui/shine-border";

type Character = {
  id: string;
  name: string;
  intensity: number;
  active: boolean;
};

export function ChatPicker({ characters }: { characters: Character[] }) {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Chat"
        description="Pick a persona to open the test chat."
        actions={
          <Button asChild variant="outline">
            <Link href="/personas/new">
              <Plus className="size-4" />
              New persona
            </Link>
          </Button>
        }
      />

      {characters.length === 0 ? (
        <BlurFade delay={0.05}>
          <Card className="relative mt-10 overflow-hidden border-dashed bg-card/40 py-0">
            <ShineBorder
              shineColor={["#5badee", "#aed4fa"]}
              borderWidth={1}
              duration={12}
            />
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Sparkles className="size-5" />
              </div>
              <p className="text-[var(--muted)]">No personas yet.</p>
              <Button asChild className="mt-5">
                <Link href="/personas/new">Create persona</Link>
              </Button>
            </CardContent>
          </Card>
        </BlurFade>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {characters.map((c, i) => (
            <BlurFade key={c.id} delay={0.04 + i * 0.03}>
              <li>
                <MagicCard className="rounded-2xl">
                  <Link
                    href={`/chat?characterId=${c.id}`}
                    className="flex items-center justify-between gap-3 p-4 transition sm:p-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
                          {c.name}
                        </h2>
                        {c.active ? (
                          <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                            Live
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Intensity {c.intensity}/5
                      </p>
                    </div>
                    <span className="inline-flex size-9 items-center justify-center rounded-xl border border-white/[0.08] text-[var(--accent)]">
                      <MessageSquare className="size-4" />
                    </span>
                  </Link>
                </MagicCard>
              </li>
            </BlurFade>
          ))}
        </ul>
      )}
    </div>
  );
}
