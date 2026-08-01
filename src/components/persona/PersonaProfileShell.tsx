"use client";

import Link from "next/link";
import { BookOpen, Brain, MessageSquare } from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { BlurFade } from "@/components/magicui/effects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PersonaProfile, PersonaTab } from "./types";

const TABS: { id: PersonaTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "mind", label: "Mind" },
  { id: "connections", label: "Connections" },
  { id: "photos", label: "Photos" },
  { id: "publish", label: "Publish" },
];

export function PersonaProfileShell({
  persona,
  displayName,
  tab,
  onTabChange,
  message,
  telegramPeerCount,
  children,
}: {
  persona: PersonaProfile;
  displayName: string;
  tab: PersonaTab;
  onTabChange: (tab: PersonaTab) => void;
  message: string | null;
  telegramPeerCount: number;
  children: React.ReactNode;
}) {
  const cover = persona.coverUrl ?? persona.photos[0]?.url ?? null;
  const initial = (displayName.trim()[0] || "?").toUpperCase();

  return (
    <div
      className="px-4 py-6 sm:px-6 sm:py-8"
      data-theme={persona.isAdult ? "after-dark" : undefined}
    >
      <BlurFade>
        <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-card/40 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="relative size-20 shrink-0 sm:size-24">
            <Avatar className="size-full rounded-2xl after:rounded-2xl">
              {cover ? <AvatarImage src={cover} alt="" className="rounded-2xl" /> : null}
              <AvatarFallback className="rounded-2xl bg-[var(--accent-soft)] font-[family-name:var(--font-display)] text-2xl text-[var(--accent)]">
                {initial}
              </AvatarFallback>
            </Avatar>
            <BorderBeam
              size={70}
              duration={7}
              colorFrom="var(--accent)"
              colorTo="var(--accent-2)"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
                {displayName}
              </h1>
              {persona.isAdult ? (
                <Badge className="bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent-soft)]">
                  18+
                </Badge>
              ) : null}
              {persona.isPublic ? <Badge variant="outline">Public</Badge> : null}
            </div>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
              {persona.tagline ||
                "Identity, memory, and every channel she lives on."}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="secondary">Intensity {persona.intensity}/5</Badge>
              <Badge variant="secondary">
                {persona.relationshipCount} relationships
              </Badge>
              <Badge variant="secondary">
                {telegramPeerCount} Telegram peers
              </Badge>
              <Badge variant="secondary">
                {persona.memoryCount} memories
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default" size="sm">
              <Link href={`/chat?characterId=${persona.id}`}>
                <MessageSquare className="size-3.5" />
                Test chat
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/personas/${persona.id}/memory`}>
                <Brain className="size-3.5" />
                Memory
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/knowledge?characterId=${persona.id}`}>
                <BookOpen className="size-3.5" />
                Sources
              </Link>
            </Button>
          </div>
        </div>
      </BlurFade>

      {message ? (
        <p className="mt-4 text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      <div className="mt-6">
        <Tabs
          value={tab}
          onValueChange={(v) => onTabChange(v as PersonaTab)}
        >
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-white/[0.06] bg-transparent p-0"
          >
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="rounded-none px-3 py-2.5 data-[state=active]:shadow-none"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-6" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
