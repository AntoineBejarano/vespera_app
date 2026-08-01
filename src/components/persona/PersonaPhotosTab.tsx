"use client";

import { PHOTO_TAG_OPTIONS } from "@/lib/chat/photos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      <Card className="h-fit shadow-none">
        <CardHeader>
          <CardTitle>Add photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={photoUrl}
            onChange={(e) => onPhotoUrlChange(e.target.value)}
            placeholder="https://…/photo.jpg"
          />
          <Input
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
                >
                  <Badge variant={on ? "default" : "outline"}>{t.label}</Badge>
                </button>
              );
            })}
          </div>
          <Button type="button" className="w-full" onClick={onAdd}>
            Add photo
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map((p) => (
          <div
            key={p.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-card"
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
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mt-1 h-auto px-0 text-red-300 hover:text-red-200"
                onClick={() => onRemove(p.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        {!photos.length ? (
          <p className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No photos yet — add a cover image to make the profile feel alive.
          </p>
        ) : null}
      </div>
    </div>
  );
}
