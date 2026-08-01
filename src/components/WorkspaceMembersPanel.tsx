"use client";

import { useEffect, useState } from "react";

type Member = {
  userId: string;
  role: string;
  roleLabel: string;
  name: string | null;
  email: string | null;
};

export function WorkspaceMembersPanel() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("viewer");
  const [members, setMembers] = useState<Member[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [canInviteAdmin, setCanInviteAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor" | "admin">(
    "viewer",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function load() {
    const wsRes = await fetch("/api/workspaces");
    if (!wsRes.ok) return;
    const wsData = await wsRes.json();
    const active =
      wsData.activeWorkspaceId ?? wsData.workspaces?.[0]?.id ?? null;
    setWorkspaceId(active);
    const mine = (wsData.workspaces ?? []).find(
      (w: { id: string }) => w.id === active,
    );
    setRole(mine?.role ?? "viewer");
    if (!active) return;

    const res = await fetch(`/api/workspaces/${active}/members`);
    const data = await res.json();
    if (res.ok) {
      setMembers(data.members ?? []);
      setCanManage(Boolean(data.canManage));
      setCanInviteAdmin(Boolean(data.canInviteAdmin));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function invite() {
    if (!workspaceId || !email.trim()) return;
    setMessage(null);
    setInviteLink(null);
    const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Could not invite");
      return;
    }
    setMessage(`Invite sent to ${data.invite.email}`);
    setInviteLink(data.invite.acceptPath);
    setEmail("");
    await load();
  }

  async function removeMember(userId: string) {
    if (!workspaceId) return;
    if (!confirm("Remove this member from the workspace?")) return;
    const res = await fetch(
      `/api/workspaces/${workspaceId}/members?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "Could not remove");
      return;
    }
    setMessage("Member removed");
    await load();
  }

  if (!workspaceId) return null;

  return (
    <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
      <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
        Team
      </h2>
      <p className="text-sm text-[var(--muted)]">
        Your role: <span className="text-[var(--ink)]">{role}</span>. Owner
        controls admins and After Dark for the workspace.
      </p>

      <ul className="space-y-2 text-sm">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex items-center justify-between gap-3 border border-[var(--line)] px-3 py-2"
          >
            <div>
              <p className="text-[var(--ink)]">
                {m.name || m.email || m.userId}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {m.roleLabel}
                {m.email ? ` · ${m.email}` : ""}
              </p>
            </div>
            {canManage && m.role !== "owner" ? (
              <button
                type="button"
                className="text-xs text-red-400"
                onClick={() => void removeMember(m.userId)}
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {canManage ? (
        <div className="space-y-2 border-t border-[var(--line)] pt-3">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
            Invite
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              className="min-w-[10rem] flex-1 border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              type="email"
            />
            <select
              className="border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "viewer" | "editor" | "admin")
              }
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              {canInviteAdmin ? <option value="admin">Admin</option> : null}
            </select>
            <button
              type="button"
              onClick={() => void invite()}
              className="bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-ink)]"
            >
              Invite
            </button>
          </div>
          {inviteLink ? (
            <p className="text-xs text-[var(--muted)]">
              Accept link:{" "}
              <code className="text-[var(--ink)]">{inviteLink}</code>
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}
    </section>
  );
}
