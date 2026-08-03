/**
 * Resolve persona cover / profile image from CharacterPhoto rows.
 * Prefers explicit isProfile; falls back to face/selfie labels, then first photo.
 */
export function resolveCoverUrl(
  photos: Array<{
    url: string;
    isProfile?: boolean;
    kind?: string | null;
    tags?: string[] | null;
  }>,
): string | null {
  if (!photos.length) return null;
  const marked = photos.find((p) => p.isProfile);
  if (marked) return marked.url;

  const face = photos.find((p) => {
    const bits = [p.kind ?? "", ...(p.tags ?? [])].map((t) =>
      t.toLowerCase().trim(),
    );
    return bits.some((t) => t === "selfie" || t === "face" || t === "cara");
  });
  return face?.url ?? photos[0]?.url ?? null;
}
