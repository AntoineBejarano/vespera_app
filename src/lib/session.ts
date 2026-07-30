import { prisma } from "@/lib/db";
import { hexclaveServerApp } from "@/hexclave/server";

/**
 * Resolve Hexclave auth → local Prisma tenant User (multi-tenant).
 */
export async function getAppUser(opts?: {
  or?: "redirect" | "throw" | "return-null";
}) {
  const mode = opts?.or ?? "return-null";

  const hx =
    mode === "redirect"
      ? await hexclaveServerApp.getUser({ or: "redirect" })
      : mode === "throw"
        ? await hexclaveServerApp.getUser({ or: "throw" })
        : await hexclaveServerApp.getUser();

  if (!hx) return null;

  const email = hx.primaryEmail?.toLowerCase() ?? null;
  const hexclaveId = hx.id;

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { hexclaveId },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        hexclaveId,
        email: email ?? `hx_${hexclaveId.slice(0, 16)}@hexclave.local`,
        name: hx.displayName ?? email?.split("@")[0] ?? "User",
        ageVerifiedAt: null,
        settings: {
          create: {
            language: "en",
            dailyLimit: Number(process.env.DAILY_MESSAGE_LIMIT ?? "40"),
          },
        },
      },
    });
  } else if (!user.hexclaveId || user.hexclaveId !== hexclaveId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        hexclaveId,
        name: user.name || hx.displayName || user.name,
        email: email ?? user.email,
      },
    });
  }

  return user;
}

export async function requireAppUser() {
  const user = await getAppUser({ or: "throw" });
  if (!user) throw new Error("UNAUTHORIZED");
  if (!user.ageVerifiedAt) throw new Error("AGE_NOT_VERIFIED");
  return user;
}
