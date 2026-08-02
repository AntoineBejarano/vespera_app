"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptInviteClient({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/workspaces/invites/${token}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not accept invite");
        return;
      }
      setMessage("Joined workspace");
      router.push("/personas");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        Join workspace
      </h1>
      <p className="text-[var(--muted)]">
        Accept this invite with the same email address that received it.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void accept()}
        className="bg-[var(--accent)] px-4 py-2 text-[var(--accent-ink)] disabled:opacity-50"
      >
        {busy ? "Joining…" : "Accept invite"}
      </button>
      {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}
    </div>
  );
}
