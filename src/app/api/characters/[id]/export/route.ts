import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import { exportPersona, type PersonaExportFormat } from "@/lib/personas/export";
import { hasWorkspacePermission } from "@/lib/workspace/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, archivedAt: null },
    select: {
      id: true,
      workspaceId: true,
      userId: true,
      name: true,
      tagline: true,
      openingLine: true,
      categories: true,
      soulMd: true,
      styleMd: true,
      rulesMd: true,
      contextMd: true,
      license: true,
      versionMajor: true,
      versionMinor: true,
      slug: true,
      isPublic: true,
    },
  });

  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const canRead =
    character.userId === user.id ||
    (await hasWorkspacePermission(
      user.id,
      character.workspaceId,
      "personas.write",
    )) ||
    character.isPublic;

  if (!canRead) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "all") as PersonaExportFormat;
  if (!["chai", "character_card", "all"].includes(format)) {
    return Response.json({ error: "Invalid format" }, { status: 400 });
  }

  const payload = exportPersona(character, format);
  return Response.json(payload);
}
