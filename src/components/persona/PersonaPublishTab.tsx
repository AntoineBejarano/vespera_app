"use client";

import Link from "next/link";
import { MagicCard } from "@/components/magicui/magic-card";
import { PlatformOperatorAck } from "@/components/PlatformOperatorAck";

export function PersonaPublishTab({
  slug,
  tagline,
  openingLine,
  categories,
  allowFork,
  isAdult,
  isPublic,
  savingPublic,
  showOperatorAck,
  operatorAck,
  onSlugChange,
  onTaglineChange,
  onOpeningLineChange,
  onCategoriesChange,
  onAllowForkChange,
  onIsAdultChange,
  onOperatorAckChange,
  onSave,
}: {
  slug: string;
  tagline: string;
  openingLine: string;
  categories: string;
  allowFork: boolean;
  isAdult: boolean;
  isPublic: boolean;
  savingPublic: boolean;
  showOperatorAck: boolean;
  operatorAck: boolean;
  onSlugChange: (v: string) => void;
  onTaglineChange: (v: string) => void;
  onOpeningLineChange: (v: string) => void;
  onCategoriesChange: (v: string) => void;
  onAllowForkChange: (v: boolean) => void;
  onIsAdultChange: (v: boolean) => void;
  onOperatorAckChange: (v: boolean) => void;
  onSave: (nextPublic?: boolean) => void;
}) {
  return (
    <MagicCard>
      <section className="mx-auto max-w-2xl space-y-4 p-5 sm:p-7">
        <div>
          <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            Public page
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Share a discoverable profile. Visitors can talk or create their own
            version when forking is allowed.
          </p>
        </div>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Slug</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[var(--muted)]">/c/</span>
            <input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value.toLowerCase())}
              placeholder="luna"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
            />
          </div>
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Tagline</span>
          <input
            value={tagline}
            onChange={(e) => onTaglineChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Opening line</span>
          <textarea
            value={openingLine}
            onChange={(e) => onOpeningLineChange(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Categories (comma-separated)</span>
          <input
            value={categories}
            onChange={(e) => onCategoriesChange(e.target.value)}
            placeholder="Companions, Mentors"
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
          />
        </label>
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowFork}
              onChange={(e) => onAllowForkChange(e.target.checked)}
            />
            Allow “Create your own version”
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAdult}
              onChange={(e) => onIsAdultChange(e.target.checked)}
            />
            Mark as 18+ listing
          </label>
        </div>
        {showOperatorAck && !isPublic ? (
          <PlatformOperatorAck
            checked={operatorAck}
            onChange={onOperatorAckChange}
            compact
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={savingPublic}
            onClick={() => onSave(true)}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-50"
          >
            {savingPublic ? "Saving…" : isPublic ? "Update public page" : "Publish"}
          </button>
          {isPublic ? (
            <>
              <Link
                href={`/c/${slug}`}
                className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm"
              >
                View /c/{slug}
              </Link>
              <button
                type="button"
                disabled={savingPublic}
                onClick={() => onSave(false)}
                className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm"
              >
                Unpublish
              </button>
            </>
          ) : null}
        </div>
      </section>
    </MagicCard>
  );
}
