import { prisma } from "@/lib/db";
import { denyAdultEnvelope } from "@/lib/core/isolation";

export async function getPersonaContext(characterId: string) {
  const character = await prisma.character.findFirst({
    where: { id: characterId, archivedAt: null },
    select: {
      id: true,
      name: true,
      soulMd: true,
      styleMd: true,
      rulesMd: true,
      contextMd: true,
      intensity: true,
      isAdult: true,
      channels: true,
      workspaceId: true,
      reasoningMode: true,
      capabilitiesJson: true,
    },
  });
  if (!character) return null;
  const blocked = denyAdultEnvelope(character);
  if (blocked) {
    return { blocked: true as const, ...blocked };
  }
  return { blocked: false as const, persona: character };
}
