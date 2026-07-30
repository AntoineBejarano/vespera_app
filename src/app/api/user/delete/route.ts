import { prisma } from "@/lib/db";
import { requireAppUser, getAppUser } from "@/lib/session";

export async function DELETE() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: user.id } });
  return Response.json({ ok: true });
}
