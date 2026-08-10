"use client";

import Link from "next/link";
import { MessageSquare, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isProfessionalPersona } from "@/lib/professionals";

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
  categories: string[];
  bots: Bot[];
  peerCount: number;
};

export function PersonasList({ initial }: { initial: Persona[] }) {
  const liveCount = initial.filter((p) => p.active).length;
  const peerTotal = initial.reduce((n, p) => n + p.peerCount, 0);

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
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold tabular-nums text-foreground">
              {initial.length}
            </span>{" "}
            personas
          </span>
          <span>
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold tabular-nums text-foreground">
              {liveCount}
            </span>{" "}
            live
          </span>
          <span>
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold tabular-nums text-foreground">
              {peerTotal}
            </span>{" "}
            Telegram peers
          </span>
        </div>
      ) : null}

      {initial.length === 0 ? (
        <Card className="mt-10 border-dashed bg-card/60 py-0 shadow-none">
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles className="size-5" />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Create your first persona
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
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
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {initial.map((p) => {
            const initialLetter = (p.name.trim()[0] || "?").toUpperCase();
            return (
              <li key={p.id}>
                <Card className="h-full gap-0 py-0 shadow-none ring-foreground/10">
                  <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
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
                          <h2 className="truncate font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                            {p.name}
                          </h2>
                          {p.active ? (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-500/15 text-emerald-300"
                            >
                              Live
                            </Badge>
                          ) : null}
                          {p.hasApiKey ? (
                            <Badge variant="outline">API</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
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
                    </Link>
                    <div className="flex gap-2 border-t border-border pt-3">
                      {isProfessionalPersona(p.categories) ? (
                        <Button asChild size="sm">
                          <Link href={`/professionals/session?characterId=${p.id}`}>
                            Professional session
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/chat?characterId=${p.id}`}>
                          <MessageSquare className="size-3.5" />
                          Chat
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/personas/${p.id}/memory`}>Memory</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
