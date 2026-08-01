"use client";

import { useEffect, useState } from "react";

type WorkspaceRow = {
  id: string;
  name: string;
  role: string;
};

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/workspaces");
    if (!res.ok) return;
    const data = await res.json();
    setWorkspaces(data.workspaces ?? []);
    setActiveId(data.activeWorkspaceId ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  if (workspaces.length <= 1) {
    return null;
  }

  async function onChange(workspaceId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        setActiveId(workspaceId);
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm text-[var(--muted)]">
      <span className="sr-only">Workspace</span>
      <select
        className="max-w-[12rem] truncate rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-[var(--ink)]"
        value={activeId ?? ""}
        disabled={busy}
        onChange={(e) => void onChange(e.target.value)}
        aria-label="Active workspace"
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </label>
  );
}
