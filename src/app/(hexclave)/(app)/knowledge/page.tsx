import { KnowledgePacksPanel } from "@/components/KnowledgePacksPanel";

type Props = {
  searchParams: Promise<{ characterId?: string }>;
};

export default async function KnowledgePage({ searchParams }: Props) {
  const sp = await searchParams;
  return <KnowledgePacksPanel characterId={sp.characterId} />;
}
