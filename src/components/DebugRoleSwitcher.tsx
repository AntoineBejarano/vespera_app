"use client";

import { useEffect, useState } from "react";

type RoleOption = {
  id: string;
  label: string;
  capabilities: string[];
};

export function DebugRoleSwitcher() {
  const [visible, setVisible] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [debugRole, setDebugRole] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [capsOpen, setCapsOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/debug/role");
    if (res.status === 403 || res.status === 401) {
      setVisible(false);
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    if (!data.isSuperadmin) {
      setVisible(false);
      return;
    }
    setVisible(true);
    setRoles(data.roles ?? []);
    setDebugRole(data.debugRole ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  if (!visible) return null;

  const selected = debugRole ?? "real";
  const activeCaps =
    selected === "real"
      ? roles.find((r) => r.id === "owner")?.capabilities ?? []
      : roles.find((r) => r.id === selected)?.capabilities ?? [];

  async function onChange(value: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/debug/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: value }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setDebugRole(data.debugRole ?? null);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <label className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
        <span className="font-medium tracking-wide uppercase">Debug</span>
        <select
          className="max-w-[7.5rem] bg-transparent text-[12px] text-[var(--ink)] outline-none"
          value={selected}
          disabled={busy}
          onChange={(e) => void onChange(e.target.value)}
          aria-label="Impersonate workspace role"
          title="Superadmin: simulate role permissions"
        >
          <option value="real">Real role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              As {r.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="rounded-md border border-amber-500/30 px-1.5 py-1 text-[10px] text-amber-200/90 hover:bg-amber-500/10"
        onClick={() => setCapsOpen((v) => !v)}
        aria-expanded={capsOpen}
        title="Show capabilities for selected role"
      >
        caps
      </button>
      {capsOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-amber-500/30 bg-[var(--bg-elevated)] p-3 shadow-xl">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-amber-200/80">
            Capabilities ({selected === "real" ? "owner default" : selected})
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-[11px] text-[var(--muted)]">
            {activeCaps.map((c) => (
              <li key={c} className="font-mono text-[var(--ink)]/90">
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
