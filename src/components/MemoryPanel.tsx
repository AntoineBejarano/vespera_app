"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type MemoryRow = {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  peerLabel?: string | null;
};

export function MemoryPanel({
  characterId,
  characterName,
}: {
  characterId: string;
  characterName: string;
}) {
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/memory?characterId=${characterId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    setMemories(data.memories ?? []);
  }

  useEffect(() => {
    void load();
  }, [characterId]);

  async function save(id: string) {
    const content = editing[id];
    if (!content?.trim()) return;
    const res = await fetch("/api/memory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not save");
      return;
    }
    setEditing((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/memory?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not delete");
      return;
    }
    await load();
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title={`Memory · ${characterName}`}
        description="What this persona remembers across test chat and Telegram peers."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/personas/${characterId}`}>Open persona</Link>
          </Button>
        }
      />
      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}
      <ul className="mt-8 space-y-3">
        {memories.length === 0 ? (
          <li className="text-muted-foreground">
            No memories yet for this persona.
          </li>
        ) : (
          memories.map((m) => (
            <li key={m.id}>
              <Card className="shadow-none">
                <CardContent className="pt-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    <span>{m.type}</span>
                    {m.peerLabel ? (
                      <Badge variant="outline" className="normal-case tracking-normal">
                        {m.peerLabel}
                      </Badge>
                    ) : null}
                  </div>
                  {editing[m.id] !== undefined ? (
                    <textarea
                      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={editing[m.id]}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [m.id]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p className="leading-relaxed text-foreground">
                      {m.content}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {editing[m.id] !== undefined ? (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto px-0"
                        onClick={() => void save(m.id)}
                      >
                        Save
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditing((prev) => ({
                            ...prev,
                            [m.id]: m.content,
                          }))
                        }
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => void remove(m.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
