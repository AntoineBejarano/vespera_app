import { prisma } from "@/lib/db";
import { requireAppUser, getAppUser } from "@/lib/session";

export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      characters: true,
      conversations: { include: { messages: true } },
      memories: true,
      settings: true,
    },
  });

  if (!profile) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { passwordHash: _, ...safe } = profile;
  return Response.json({
    exportedAt: new Date().toISOString(),
    user: safe,
  });
}
