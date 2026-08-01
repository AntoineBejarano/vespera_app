import "server-only";
import { prisma } from "@/lib/db";
import { searchKnowledge } from "@/lib/knowledge/vector";

/**
 * Resolve active knowledge packs linked to a character, then query Upstash.
 * Chat never re-fetches remote documents — only the Vesperer index.
 */
export async function searchCharacterKnowledge(params: {
  characterId: string;
  query: string;
  topK?: number;
}): Promise<string[]> {
  const links = await prisma.characterKnowledgePack.findMany({
    where: {
      characterId: params.characterId,
      active: true,
      knowledgePack: { active: true },
    },
    select: { knowledgePackId: true },
  });
  if (!links.length) return [];

  const perPack = Math.max(2, Math.ceil((params.topK ?? 6) / links.length));
  const briefs: Array<{ text: string; score: number }> = [];

  await Promise.all(
    links.map(async (link) => {
      const hits = await searchKnowledge({
        knowledgePackId: link.knowledgePackId,
        query: params.query,
        topK: perPack,
      });
      for (const hit of hits) {
        const work = hit.metadata.work || hit.metadata.section;
        const prefix = work ? `[${work}] ` : "";
        briefs.push({ text: `${prefix}${hit.text}`, score: hit.score });
      }
    }),
  );

  briefs.sort((a, b) => b.score - a.score);
  return briefs.slice(0, params.topK ?? 6).map((b) => b.text);
}
