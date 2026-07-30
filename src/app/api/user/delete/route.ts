import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: session.user.id } });
  return Response.json({ ok: true });
}
