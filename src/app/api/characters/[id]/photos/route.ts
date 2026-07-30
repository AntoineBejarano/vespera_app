import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/users";

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
  return NextResponse.json({ photos });
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
  const kind = String(body.kind ?? "selfie").trim() || "selfie";

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "Need a public http(s) image URL" },
      { status: 400 },
    );
  }

  const photo = await prisma.characterPhoto.create({
    data: { characterId: id, url, caption, kind },
  });
  return NextResponse.json({ photo });
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
