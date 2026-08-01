"use client";

import Link from "next/link";
import { MessageSquare, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
      />

      {characters.length === 0 ? (
        <Card className="mt-10 border-dashed bg-card/60 py-0 shadow-none">
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles className="size-5" />
            </div>
            <p className="text-muted-foreground">No personas yet.</p>
            <Button asChild className="mt-5">
              <Link href="/personas/new">
                <Plus className="size-4" />
                Create persona
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {characters.map((c) => (
            <li key={c.id}>
              <Card className="gap-0 py-0 shadow-none ring-foreground/10 transition hover:ring-foreground/20">
                <Link
                  href={`/chat?characterId=${c.id}`}
                  className="flex items-center justify-between gap-3 p-4 sm:p-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                        {c.name}
                      </h2>
                      {c.active ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/15 text-emerald-300"
                        >
                          Live
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Intensity {c.intensity}/5
                    </p>
                  </div>
                  <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-[var(--accent)]">
                    <MessageSquare className="size-4" />
                  </span>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
