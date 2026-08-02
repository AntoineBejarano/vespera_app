"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { WorkspaceMembersPanel } from "@/components/WorkspaceMembersPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type WorkspaceRow = {
  id: string;
  name: string;
  role: string;
  adultEnabled?: boolean;
  capabilities?: string[];
};

export function WorkspacesManageClient() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [rename, setRename] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [personaCount, setPersonaCount] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/workspaces");
    if (!res.ok) return;
    const data = await res.json();
    setWorkspaces(data.workspaces ?? []);
    setActiveId(data.activeWorkspaceId ?? null);
    const active =
      (data.workspaces ?? []).find(
        (w: WorkspaceRow) => w.id === data.activeWorkspaceId,
      ) ?? data.workspaces?.[0];
    if (active) setRename(active.name);
  }

  async function loadPersonaCount() {
    const res = await fetch("/api/characters");
    if (!res.ok) {
      setPersonaCount(null);
      return;
    }
    const data = await res.json();
    setPersonaCount((data.characters ?? []).length);
  }

  useEffect(() => {
    void load();
    void loadPersonaCount();
  }, []);

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];
  const caps = new Set(active?.capabilities ?? []);
  const canUpdate = caps.has("workspace.update");
  const canDelete = caps.has("workspace.delete");

  async function switchTo(workspaceId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Could not switch");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    if (!newName.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), switchTo: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not create");
        return;
      }
      window.location.href = "/workspaces";
    } finally {
      setBusy(false);
    }
  }

  async function saveRename() {
    if (!active || !rename.trim() || !canUpdate) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/workspaces/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rename.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not rename");
        return;
      }
      setMessage("Workspace renamed");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeWorkspace() {
    if (!active || !canDelete) return;
    if (confirmDelete !== active.name) {
      setMessage("Type the exact workspace name to confirm delete");
      return;
    }
    if (
      !confirm(
        `Delete “${active.name}” permanently? Personas and knowledge in this workspace will be removed.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/workspaces/${active.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: confirmDelete }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Could not delete");
        return;
      }
      window.location.href = "/workspaces";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Workspaces"
        description="A workspace is a shared studio: people, AI personas, and knowledge packs. Switch below, invite humans, then add personas under Personas."
      />

      {message ? (
        <p className="text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Your workspaces</CardTitle>
          <CardDescription>
            Active workspace drives Personas, Sources, and Chat. Guests use the
            Viewer role (read-only).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {workspaces.map((w) => {
              const isActive = w.id === active?.id;
              return (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {w.name}
                      {isActive ? (
                        <Badge className="ml-2" variant="secondary">
                          Active
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-[11px] capitalize text-muted-foreground">
                      {w.role}
                      {w.role === "viewer" ? " · guest / read-only" : ""}
                    </p>
                  </div>
                  {!isActive ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void switchTo(w.id)}
                    >
                      Switch here
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/personas">Open personas</Link>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New workspace name"
              className="min-w-[12rem] flex-1"
            />
            <Button
              type="button"
              disabled={busy || !newName.trim()}
              onClick={() => void create()}
            >
              Create workspace
            </Button>
          </div>
        </CardContent>
      </Card>

      {active ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Active: {active.name}</CardTitle>
            <CardDescription>
              {personaCount == null
                ? "Loading personas…"
                : `${personaCount} AI persona${personaCount === 1 ? "" : "s"} in this workspace`}
              . Add more under{" "}
              <Link href="/personas/new" className="underline underline-offset-2">
                Personas
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canUpdate ? (
              <div className="flex flex-wrap gap-2">
                <Input
                  value={rename}
                  onChange={(e) => setRename(e.target.value)}
                  className="min-w-[12rem] flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void saveRename()}
                >
                  Rename
                </Button>
              </div>
            ) : null}

            {canDelete ? (
              <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Delete requires typing the exact name:{" "}
                  <span className="font-medium text-foreground">
                    {active.name}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.value)}
                    placeholder={active.name}
                    className="min-w-[12rem] flex-1"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy || confirmDelete !== active.name}
                    onClick={() => void removeWorkspace()}
                  >
                    Delete workspace
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <WorkspaceMembersPanel />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Group chat with several personas</CardTitle>
          <CardDescription>
            Prefer a real Telegram group with one bot per persona (Telegram
            allows multiple bots). If that does not fit the conversation style
            you want, we can orchestrate several minds behind a single bot
            thread.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Create or pick personas in this workspace.</li>
            <li>
              In each persona&apos;s Agency tab, connect a Telegram bot and turn
              off privacy mode so the bot sees group messages.
            </li>
            <li>
              Create a Telegram group and add those bots — each persona answers
              as themselves.
            </li>
          </ol>
          <p>
            Single-bot multi-persona orchestration (one thread, several minds)
            is the fallback when a multi-bot group is not enough — shipping next.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/personas">Go to personas →</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
