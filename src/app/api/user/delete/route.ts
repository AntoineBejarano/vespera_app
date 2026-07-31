import { prisma } from "@/lib/db";
import { hexclaveServerApp } from "@/hexclave/server";
import { getAppUser } from "@/lib/session";

/**
 * Self-serve account deletion (GDPR):
 * 1) Delete local Prisma tenant (cascade app data)
 * 2) Delete Hexclave identity so re-login cannot re-provision the same account
 */
export async function DELETE() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const hexclaveId = user.hexclaveId;

  await prisma.user.delete({ where: { id: user.id } });

  if (hexclaveId) {
    try {
      const hx = await hexclaveServerApp.getUser(hexclaveId);
      if (hx) {
        await hx.delete();
      }
    } catch (err) {
      console.error("[user/delete] Hexclave identity delete failed", err);
      return Response.json(
        {
          ok: true,
          warning:
            "App data deleted; auth identity cleanup failed. Contact support if you can still sign in.",
        },
        { status: 200 },
      );
    }
  }

  return Response.json({ ok: true });
}
