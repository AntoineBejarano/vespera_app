import { prisma } from "@/lib/db";
import { getShowcaseBySlug } from "@/lib/characters/showcase";
import { exportPersona, type PersonaExportFormat } from "@/lib/personas/export";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Params) {
  const { slug } = await params;
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "all") as PersonaExportFormat;
  if (!["chai", "character_card", "all"].includes(format)) {
    return Response.json({ error: "Invalid format" }, { status: 400 });
  }

  try {
    const character = await prisma.character.findFirst({
      where: { slug, isPublic: true },
      select: {
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
      },
    });

    if (character) {
      return Response.json(exportPersona(character, format));
    }
  } catch {
    // Fall through to showcase.
  }

  const showcase = getShowcaseBySlug(slug);
  if (!showcase) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(
    exportPersona(
      {
        name: showcase.name,
        tagline: showcase.tagline,
        openingLine: showcase.openingLine,
        categories: showcase.categories,
        soulMd: showcase.soulMd,
        styleMd: showcase.styleMd,
        rulesMd: showcase.rulesMd,
        contextMd: showcase.contextMd,
        license: "commercial",
        versionMajor: 1,
        versionMinor: 0,
        slug: showcase.slug,
      },
      format,
    ),
  );
}
