import { prisma } from "@/lib/db";
import { getShowcaseBySlug } from "@/lib/characters/showcase";
import {
  buildMindGraph,
  layersToMindDocs,
  type MindDoc,
} from "@/lib/persona/mind-graph";

type Params = { params: Promise<{ slug: string }> };

/**
 * Public mind graph — identity layers + knowledge pack titles only.
 * Never exposes private memories, peers, or API secrets.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;

  try {
    const character = await prisma.character.findFirst({
      where: { slug, isPublic: true },
      select: {
        id: true,
        name: true,
        soulMd: true,
        styleMd: true,
        rulesMd: true,
        contextMd: true,
        knowledgeLinks: {
          where: { active: true },
          include: {
            knowledgePack: {
              select: { id: true, name: true, description: true },
            },
          },
          take: 16,
        },
      },
    });

    if (character) {
      const docs: MindDoc[] = [
        ...layersToMindDocs(character),
        ...character.knowledgeLinks.map((link) => ({
          id: `pack-${link.knowledgePack.id}`,
          title: link.knowledgePack.name,
          group: "knowledge",
          content: [
            link.knowledgePack.name,
            link.knowledgePack.description ?? "",
          ]
            .filter(Boolean)
            .join("\n\n"),
        })),
      ];

      // Public surface: layers + knowledge packs only (Obsidian vault stays private)

      const graph = buildMindGraph(docs, {
        rootId: `persona:${character.id}`,
        rootLabel: character.name,
        maxConcepts: 70,
      });

      return Response.json({
        graph,
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

  const docs = layersToMindDocs(showcase);
  const graph = buildMindGraph(docs, {
    rootId: `persona:showcase:${showcase.slug}`,
    rootLabel: showcase.name,
    maxConcepts: 70,
  });

  return Response.json({
    graph,
    stats: {
      nodeCount: graph.nodes.length,
      linkCount: graph.links.length,
    },
  });
}
