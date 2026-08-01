"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MagicCard } from "@/components/magicui/magic-card";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Button } from "@/components/ui/button";

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
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <ul className="mt-8 space-y-3">
        {memories.length === 0 ? (
          <li className="text-[var(--muted)]">
            No memories yet for this persona.
          </li>
        ) : (
          memories.map((m) => (
            <li key={m.id}>
              <MagicCard>
                <div className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                    <span>{m.type}</span>
                    {m.peerLabel ? (
                      <span className="rounded-full border border-[var(--line)] px-2 py-0.5 normal-case tracking-normal">
                        {m.peerLabel}
                      </span>
                    ) : null}
                  </div>
                  {editing[m.id] !== undefined ? (
                    <textarea
                      className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
                      value={editing[m.id]}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [m.id]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p className="leading-relaxed text-[var(--ink)]">
                      {m.content}
                    </p>
                  )}
                  <div className="mt-3 flex gap-3 text-sm">
                    {editing[m.id] !== undefined ? (
                      <button
                        type="button"
                        className="text-[var(--accent)]"
                        onClick={() => save(m.id)}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-[var(--muted)]"
                        onClick={() =>
                          setEditing((prev) => ({
                            ...prev,
                            [m.id]: m.content,
                          }))
                        }
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-[var(--danger)]"
                      onClick={() => remove(m.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </MagicCard>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
