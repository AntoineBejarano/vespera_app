"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PackOpt = {
  id: string;
  name: string;
  description: string | null;
  chunkCount: number;
  characters: Array<{ character: { id: string; name: string } }>;
};

/**
 * Persona-side view: which knowledge packs this persona is taught from.
 * Assign/unassign without leaving the studio.
 */
export function PersonaTaughtFrom({ personaId }: { personaId: string }) {
  const [packs, setPacks] = useState<PackOpt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/knowledge/packs");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load packs");
      return;
    }
    setPacks(data.packs ?? []);
    setError(null);
  }

  useEffect(() => {
    void load();
  }, []);

  function isAssigned(pack: PackOpt) {
    return pack.characters.some((c) => c.character.id === personaId);
  }

  async function toggle(pack: PackOpt) {
    setBusyId(pack.id);
    setError(null);
    const assigned = isAssigned(pack);
    try {
      if (assigned) {
        const res = await fetch(
          `/api/knowledge/packs/${pack.id}/links?characterId=${encodeURIComponent(personaId)}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Could not unassign");
          return;
        }
      } else {
        const currentIds = pack.characters.map((c) => c.character.id);
        const res = await fetch(`/api/knowledge/packs/${pack.id}/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characterIds: [...new Set([...currentIds, personaId])],
            replace: true,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Could not assign");
          return;
        }
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const taught = packs.filter(isAssigned);
  const available = packs.filter((p) => !isAssigned(p));

  return (
    <Card className="shadow-none lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Taught from</CardTitle>
        <CardDescription>
          Knowledge packs assigned to this persona. Upload material in Sources,
          then turn teaching on or off here — other personas stay unaffected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {packs.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              No knowledge packs yet. Create one and assign it to this persona.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={`/knowledge?characterId=${personaId}`}>
                Open Sources
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Assigned ({taught.length})
              </p>
              {taught.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing assigned yet — this persona only uses their Self
                  layers until you teach them a pack.
                </p>
              ) : (
                <ul className="space-y-2">
                  {taught.map((pack) => (
                    <li
                      key={pack.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {pack.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {pack.chunkCount} chunks
                          {pack.description
                            ? ` · ${pack.description.slice(0, 80)}`
                            : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === pack.id}
                        onClick={() => void toggle(pack)}
                      >
                        Unassign
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {available.length > 0 ? (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Available packs
                </p>
                <ul className="space-y-2">
                  {available.map((pack) => (
                    <li
                      key={pack.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {pack.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {pack.chunkCount} chunks
                          {pack.characters.length
                            ? ` · taught to ${pack.characters.map((c) => c.character.name).join(", ")}`
                            : " · not taught to anyone yet"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId === pack.id}
                        onClick={() => void toggle(pack)}
                      >
                        Teach this persona
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Button asChild size="sm" variant="ghost">
              <Link href={`/knowledge?characterId=${personaId}`}>
                Manage packs in Sources →
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
