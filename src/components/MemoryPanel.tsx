"use client";

import { useEffect, useState } from "react";
import { MagicCard } from "@/components/magicui/magic-card";

type MemoryRow = {
  id: string;
  type: string;
  content: string;
  createdAt: string;
};

export function MemoryPanel() {
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/memory");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    setMemories(data.memories ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
        What she remembers
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Edit or delete memories. Transparency builds trust.
      </p>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <ul className="mt-8 space-y-3">
        {memories.length === 0 ? (
          <li className="text-[var(--muted)]">
            No long memories yet. They appear as the relationship grows.
          </li>
        ) : (
          memories.map((m) => (
            <li key={m.id}>
              <MagicCard>
                <div className="p-4">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                    {m.type}
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
