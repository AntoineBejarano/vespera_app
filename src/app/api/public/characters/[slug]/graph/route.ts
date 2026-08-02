import { prisma } from "@/lib/db";
import { getShowcaseBySlug } from "@/lib/characters/showcase";
import {
  buildMindGraph,
  publicLayersToMindDocs,
  type MindDoc,
} from "@/lib/persona/mind-graph";

type Params = { params: Promise<{ slug: string }> };

/**
 * Public mind graph — allowlist only.
 * Never returns rulesMd, limitsJson, memories, affect, intentions, tools, or private chunks.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;

  try {
    const character = await prisma.character.findFirst({
      where: { slug, isPublic: true },
      select: {
        id: true,
        name: true,
        tagline: true,
        openingLine: true,
        categories: true,
        styleMd: true,
        metaJson: true,
        knowledgeLinks: {
          where: { active: true },
          include: {
            knowledgePack: {
              select: {
                id: true,
                name: true,
                description: true,
                /** Only pack titles/topics — never chunks */
                slug: true,
              },
            },
          },
          take: 16,
        },
      },
    });

    if (character) {
      const meta = (character.metaJson ?? {}) as {
        publicTraits?: string[];
        traits?: { warmth?: number; playfulness?: number; directness?: number };
      };
      const traitLabels =
        meta.publicTraits ??
        (meta.traits
          ? Object.entries(meta.traits)
              .filter(([, v]) => typeof v === "number" && v >= 0.55)
              .map(([k]) => k)
          : undefined);

      const docs: MindDoc[] = [
        ...publicLayersToMindDocs({
          name: character.name,
          tagline: character.tagline,
          openingLine: character.openingLine,
          categories: character.categories,
          styleMd: character.styleMd,
          traits: traitLabels,
        }),
        ...character.knowledgeLinks.map((link) => ({
          id: `pack-${link.knowledgePack.id}`,
          title: link.knowledgePack.name,
          group: "knowledge",
          type: "knowledge" as const,
          universe: "knowledge" as const,
          content: [
            link.knowledgePack.name,
            link.knowledgePack.description?.slice(0, 200) ?? "",
            link.knowledgePack.slug ? `topic: ${link.knowledgePack.slug}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        })),
      ];

      const graph = buildMindGraph(docs, {
        rootId: `persona:${character.id}`,
        rootLabel: character.name,
        maxConcepts: 40,
      });

      return Response.json({
        graph,
        public: true,
        stats: {
          nodeCount: graph.nodes.length,
          linkCount: graph.links.length,
        },
      });
    }
  } catch {
    // fall through to showcase
  }

  const showcase = getShowcaseBySlug(slug);
  if (!showcase) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const docs = publicLayersToMindDocs({
    name: showcase.name,
    tagline: showcase.tagline,
    openingLine: showcase.openingLine,
    categories: showcase.categories,
    styleMd: showcase.styleMd,
  });
  const graph = buildMindGraph(docs, {
    rootId: `persona:showcase:${showcase.slug}`,
    rootLabel: showcase.name,
    maxConcepts: 40,
  });

  return Response.json({
    graph,
    public: true,
    stats: {
      nodeCount: graph.nodes.length,
      linkCount: graph.links.length,
    },
  });
}
