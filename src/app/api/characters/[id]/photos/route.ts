import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { kindFromTags, normalizeTags } from "@/lib/chat/photos";
import { requireAppUser } from "@/lib/session";
import { ContentPolicyError, EXPLICIT_PHOTO_TAGS } from "@/lib/content-policy";

function labelsLookExplicit(labels: string[]) {
  return labels.some((raw) => {
    const parts = raw
      .toLowerCase()
      .split(/[\s,/|_-]+/)
      .filter(Boolean);
    return parts.some((p) => EXPLICIT_PHOTO_TAGS.has(p));
  });
}

function rejectExplicitTags(tags: string[]) {
  if (!labelsLookExplicit(tags)) return;
  // Deny-by-default until HEAA + image moderation are live
  throw new ContentPolicyError(
    "Explicit image capability blocked until age assurance and moderation",
    "IMAGE_EXPLICIT_BLOCKED",
  );
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await prisma.characterPhoto.findMany({
    where: { characterId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ photos });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const url = String(body.url ?? "").trim();
  const caption =
    body.caption != null ? String(body.caption).trim() || null : null;
  const labelField =
    body.label != null ? String(body.label) : undefined;
  const tags = normalizeTags(
    labelField != null
      ? labelField
      : body.tags != null
        ? body.tags
        : body.kind,
  );
  const kind =
    String(body.kind ?? kindFromTags(tags))
      .toLowerCase()
      .trim() || kindFromTags(tags);

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "Need a public http(s) image URL" },
      { status: 400 },
    );
  }
  if (!tags.length) {
    return NextResponse.json(
      { error: "Need a free-text label (e.g. face, hand, red car)" },
      { status: 400 },
    );
  }

  try {
    rejectExplicitTags(tags);
  } catch (err) {
    if (err instanceof ContentPolicyError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 403 },
      );
    }
    throw err;
  }

  const existingProfile = await prisma.characterPhoto.findFirst({
    where: { characterId: id, isProfile: true },
    select: { id: true },
  });
  const makeProfile =
    body.isProfile === true || !existingProfile;

  const photo = await prisma.characterPhoto.create({
    data: {
      characterId: id,
      url,
      caption,
      kind,
      tags,
      isProfile: makeProfile,
    },
  });

  if (makeProfile && existingProfile) {
    await prisma.characterPhoto.updateMany({
      where: {
        characterId: id,
        isProfile: true,
        NOT: { id: photo.id },
      },
      data: { isProfile: false },
    });
  }

  return NextResponse.json({ photo });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const photoId = String(body.photoId ?? "").trim();
  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  // Explicit profile / cover selection
  if (body.setAsProfile === true || body.isProfile === true) {
    const owned = await prisma.characterPhoto.findFirst({
      where: { id: photoId, characterId: id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.$transaction([
      prisma.characterPhoto.updateMany({
        where: { characterId: id, isProfile: true },
        data: { isProfile: false },
      }),
      prisma.characterPhoto.update({
        where: { id: photoId },
        data: { isProfile: true },
      }),
    ]);
    const updated = await prisma.characterPhoto.findUnique({
      where: { id: photoId },
    });
    return NextResponse.json({ photo: updated });
  }

  const labelField =
    body.label != null ? String(body.label) : undefined;
  const tags =
    labelField != null
      ? normalizeTags(labelField)
      : body.tags !== undefined
        ? normalizeTags(body.tags)
        : undefined;
  const kind =
    body.kind != null
      ? String(body.kind).toLowerCase().trim() || undefined
      : tags
        ? kindFromTags(tags)
        : undefined;
  const caption =
    body.caption !== undefined
      ? String(body.caption).trim() || null
      : undefined;

  if (tags) {
    if (!tags.length) {
      return NextResponse.json(
        { error: "Need a free-text label" },
        { status: 400 },
      );
    }
    try {
      rejectExplicitTags(tags);
    } catch (err) {
      if (err instanceof ContentPolicyError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: 403 },
        );
      }
      throw err;
    }
  }

  const photo = await prisma.characterPhoto.updateMany({
    where: { id: photoId, characterId: id },
    data: {
      ...(tags ? { tags, kind: kind ?? kindFromTags(tags) } : {}),
      ...(kind && !tags ? { kind } : {}),
      ...(caption !== undefined ? { caption } : {}),
    },
  });

  if (!photo.count) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.characterPhoto.findUnique({
    where: { id: photoId },
  });
  return NextResponse.json({ photo: updated });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const photoId = searchParams.get("photoId");
  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  await prisma.characterPhoto.deleteMany({
    where: { id: photoId, characterId: id },
  });

  const stillHasProfile = await prisma.characterPhoto.findFirst({
    where: { characterId: id, isProfile: true },
    select: { id: true },
  });
  if (!stillHasProfile) {
    const next = await prisma.characterPhoto.findFirst({
      where: { characterId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (next) {
      await prisma.characterPhoto.update({
        where: { id: next.id },
        data: { isProfile: true },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
