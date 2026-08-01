import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ChatPanel } from "@/components/ChatPanel";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ characterId?: string }>;
}) {
  const { characterId } = await searchParams;
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");

  if (!characterId) {
    const characters = await prisma.character.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, intensity: true, active: true },
    });

    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
          Chat
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pick a persona to open the test chat.
        </p>
        {characters.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-white/[0.1] px-6 py-12 text-center">
            <p className="text-[var(--muted)]">No personas yet.</p>
            <Link
              href="/personas/new"
              className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
            >
              Create persona
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-[var(--bg-elevated)]/40">
            {characters.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat?characterId=${c.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm transition hover:bg-white/[0.03] sm:px-5"
                >
                  <span className="font-medium text-[var(--ink)]">{c.name}</span>
                  <span className="text-[var(--muted)]">
                    Intensity {c.intensity}/5
                    {c.active ? " · live" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, name: true, intensity: true, active: true },
  });
  if (!character) redirect("/chat");

  return (
    <ChatPanel characters={[character]} initialCharacterId={character.id} />
  );
}
