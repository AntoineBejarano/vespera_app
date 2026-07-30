import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      characters: true,
      conversations: { include: { messages: true } },
      memories: true,
      settings: true,
    },
  });

  if (!user) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }

  const { passwordHash: _, ...safe } = user;
  return Response.json({
    exportedAt: new Date().toISOString(),
    user: safe,
  });
}
