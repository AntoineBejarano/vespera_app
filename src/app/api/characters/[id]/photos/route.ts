import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/users";
import { normalizeTags, PHOTO_TAG_OPTIONS } from "@/lib/chat/photos";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  await requireUser(session.user.id);
  const { id } = await ctx.params;

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await prisma.characterPhoto.findMany({
    where: { characterId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ photos, tagOptions: PHOTO_TAG_OPTIONS });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  await requireUser(session.user.id);
  const { id } = await ctx.params;

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const url = String(body.url ?? "").trim();
  const caption =
    body.caption != null ? String(body.caption).trim() || null : null;
  const tags = normalizeTags(body.tags);
  const kind =
    String(body.kind ?? tags[0] ?? "selfie")
      .toLowerCase()
      .trim() || "selfie";

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "Need a public http(s) image URL" },
      { status: 400 },
    );
  }

  const photo = await prisma.characterPhoto.create({
    data: {
      characterId: id,
      url,
      caption,
      kind,
      tags: tags.length ? tags : [kind],
    },
  });
  return NextResponse.json({ photo });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  await requireUser(session.user.id);
  const { id } = await ctx.params;

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const photoId = String(body.photoId ?? "").trim();
  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  const tags =
    body.tags !== undefined ? normalizeTags(body.tags) : undefined;
  const kind =
    body.kind != null
      ? String(body.kind).toLowerCase().trim() || undefined
      : undefined;
  const caption =
    body.caption !== undefined
      ? String(body.caption).trim() || null
      : undefined;

  const photo = await prisma.characterPhoto.updateMany({
    where: { id: photoId, characterId: id },
    data: {
      ...(tags ? { tags, kind: kind ?? tags[0] ?? "selfie" } : {}),
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  await requireUser(session.user.id);
  const { id } = await ctx.params;

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
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
  return NextResponse.json({ ok: true });
}
