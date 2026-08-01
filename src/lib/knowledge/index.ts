export { listProviders, providerMeta, getAdapter } from "@/lib/knowledge/adapters/registry";
export {
  createKnowledgePack,
  createPackFromSeed,
  listSeedTemplates,
  addSource,
  inspectSource,
  startSourceIngest,
  reindexPack,
  linkPackToCharacters,
} from "@/lib/knowledge/packs";
export { searchCharacterKnowledge } from "@/lib/knowledge/retrieve";
export { searchKnowledge, buildKnowledgeFilter } from "@/lib/knowledge/vector";
export { PLATO_ESSENTIALS_SEED } from "@/lib/knowledge/seeds/plato-essentials";
