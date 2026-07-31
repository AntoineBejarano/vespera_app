"use client";

import Link from "next/link";
import { PLATFORM_OPERATOR_ACK_LABEL, PLATFORM_OPERATOR_ACK_POINTS } from "@/lib/legal/operator-content";

export function PlatformOperatorAck({
  checked,
  onChange,
  compact,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <label className="flex gap-2 text-sm leading-snug text-[var(--muted)]">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>
          {PLATFORM_OPERATOR_ACK_LABEL}{" "}
          <Link href="/legal/terms#operators" className="underline">
            Details
          </Link>
        </span>
      </label>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 p-4 text-sm">
      <p className="font-medium text-[var(--ink)]">Platform operator (you)</p>
      <p className="mt-1 text-[var(--muted)]">
        Vesperer provides the technology. When you connect Telegram, API access,
        or a public page to end users, you operate the channel and accept:
      </p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-[var(--muted)]">
        {PLATFORM_OPERATOR_ACK_POINTS.map((line) => (
          <li key={line.slice(0, 40)}>{line}</li>
        ))}
      </ul>
      <label className="mt-4 flex gap-2 leading-snug">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 shrink-0"
        />
        <span>
          {PLATFORM_OPERATOR_ACK_LABEL}{" "}
          <Link href="/legal/terms" className="underline">
            Terms
          </Link>
          {" · "}
          <Link href="/legal/acceptable-use" className="underline">
            AUP
          </Link>
        </span>
      </label>
    </div>
  );
}
