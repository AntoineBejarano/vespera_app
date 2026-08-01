"use client";

import { PHOTO_TAG_OPTIONS } from "@/lib/chat/photos";
import { MagicCard } from "@/components/magicui/magic-card";
import type { PersonaPhoto } from "./types";

export function PersonaPhotosTab({
  photos,
  photoUrl,
  photoCaption,
  selectedTags,
  onPhotoUrlChange,
  onPhotoCaptionChange,
  onToggleTag,
  onAdd,
  onRemove,
}: {
  photos: PersonaPhoto[];
  photoUrl: string;
  photoCaption: string;
  selectedTags: string[];
  onPhotoUrlChange: (v: string) => void;
  onPhotoCaptionChange: (v: string) => void;
  onToggleTag: (id: string) => void;
  onAdd: () => void;
  onRemove: (photoId: string) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <MagicCard className="h-fit">
        <section className="space-y-3 p-5">
          <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            Add photo
          </h2>
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
            value={photoUrl}
            onChange={(e) => onPhotoUrlChange(e.target.value)}
            placeholder="https://…/photo.jpg"
          />
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
            value={photoCaption}
            onChange={(e) => onPhotoCaptionChange(e.target.value)}
            placeholder="Optional caption"
          />
          <div className="flex flex-wrap gap-2">
            {PHOTO_TAG_OPTIONS.map((t) => {
              const on = selectedTags.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToggleTag(t.id)}
                  className={
                    on
                      ? "rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 text-xs"
                      : "rounded-lg border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]"
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-ink)]"
          >
            Add photo
          </button>
        </section>
      </MagicCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map((p) => (
          <div
            key={p.id}
            className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-xs text-white/90">
                {(p.tags?.length ? p.tags : [p.kind]).join(", ")}
              </p>
              {p.caption ? (
                <p className="mt-0.5 truncate text-[11px] text-white/60">
                  {p.caption}
                </p>
              ) : null}
              <button
                type="button"
                className="mt-2 text-xs text-red-300 hover:text-red-200"
                onClick={() => onRemove(p.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {!photos.length ? (
          <p className="col-span-full rounded-2xl border border-dashed border-[var(--line)] p-10 text-center text-sm text-[var(--muted)]">
            No photos yet — add a cover image to make the profile feel alive.
          </p>
        ) : null}
      </div>
    </div>
  );
}
