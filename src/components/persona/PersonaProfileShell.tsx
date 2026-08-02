"use client";

import Link from "next/link";
import { BookOpen, Brain, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PersonaProfile, PersonaTab } from "./types";

const TABS: { id: PersonaTab; label: string }[] = [
  { id: "mind", label: "Mind" },
  { id: "self", label: "Self" },
  { id: "agency", label: "Agency" },
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
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <Avatar className="size-20 shrink-0 rounded-2xl sm:size-24">
          {cover ? (
            <AvatarImage src={cover} alt="" className="rounded-2xl" />
          ) : null}
          <AvatarFallback className="rounded-2xl bg-[var(--accent-soft)] font-[family-name:var(--font-display)] text-2xl text-[var(--accent)]">
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {displayName}
            </h1>
            {persona.isAdult ? (
              <Badge className="bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent-soft)]">
                18+
              </Badge>
            ) : null}
            {persona.isPublic ? <Badge variant="outline">Public</Badge> : null}
          </div>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {persona.tagline ||
              "See who they are, what they know, who they remember, how relationships evolve, what they want and what they can do."}
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
          <Button asChild size="sm">
            <Link href={`/chat?characterId=${persona.id}`}>
              <MessageSquare className="size-3.5" />
              Chat
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/personas/${persona.id}/memory`}>
              <Brain className="size-3.5" />
              Memory
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/knowledge?characterId=${persona.id}`}>
              <BookOpen className="size-3.5" />
              Teach / Sources
            </Link>
          </Button>
        </div>
      </div>

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
            className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0"
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
