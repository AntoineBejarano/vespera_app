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

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

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

  if (workspaces.length === 0) {
    return (
      <div className="rounded-lg border border-white/[0.06] px-2.5 py-2 text-[12px] text-[var(--muted)]">
        Workspace
      </div>
    );
  }

  if (workspaces.length === 1) {
    return (
      <div className="rounded-lg border border-white/[0.06] px-2.5 py-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]/70">
          Workspace
        </p>
        <p className="mt-0.5 truncate text-[13px] font-medium text-[var(--ink)]">
          {active?.name ?? "Personal"}
        </p>
      </div>
    );
  }

  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]/70">
        Workspace
      </span>
      <select
        className="w-full truncate rounded-lg border border-white/[0.08] bg-[var(--bg)] px-2.5 py-2 text-[13px] text-[var(--ink)]"
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
