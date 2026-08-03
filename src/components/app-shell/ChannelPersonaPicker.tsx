"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PersonaPickerTarget } from "./nav-items";

type PersonaOption = {
  id: string;
  name: string;
  botCount: number;
  active: boolean;
};

export function ChannelPersonaPicker({
  open,
  onOpenChange,
  channelLabel,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelLabel: string;
  target: PersonaPickerTarget;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<PersonaOption[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch("/api/characters");
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Could not load personas");
          return;
        }
        if (!cancelled) {
          setPersonas(
            (data.characters ?? []).map(
              (c: {
                id: string;
                name: string;
                botCount?: number;
                active: boolean;
              }) => ({
                id: c.id,
                name: c.name,
                botCount: c.botCount ?? 0,
                active: c.active,
              }),
            ),
          );
        }
      } catch {
        if (!cancelled) setError("Could not load personas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = personas.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function pick(id: string) {
    onOpenChange(false);
    setQuery("");
    router.push(`/personas/${id}?tab=${target.tab}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(100vw,22rem)] sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Choose a persona</SheetTitle>
          <SheetDescription>
            Open {channelLabel} settings for that character.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3 px-4 pb-6">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search personas…"
            autoFocus
          />

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              <p>No personas yet.</p>
              <Button asChild size="sm" variant="outline">
                <a href="/personas/new">Create a persona</a>
              </Button>
            </div>
          ) : null}

          <ul className="space-y-1">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pick(p.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition hover:bg-white/[0.04]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Bot className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {p.name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {p.botCount > 0
                        ? `${p.botCount} Telegram bot${p.botCount === 1 ? "" : "s"}`
                        : "No bot connected yet"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
