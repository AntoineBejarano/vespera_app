import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hexclaveServerApp } from "@/hexclave/server";

/**
 * Resolve Hexclave auth → local Prisma tenant User (multi-tenant).
 *
 * Never use Hexclave's `{ or: "redirect" }` on the server with hosted auth —
 * it needs a browser URL for the OAuth callback and throws HexclaveAssertionError.
 * Instead redirect to `/?auth=signin` so the client can call redirectToSignIn().
 */
export async function getAppUser(opts?: {
  or?: "redirect" | "throw" | "return-null";
}) {
  const mode = opts?.or ?? "return-null";

  let hx;
  try {
    hx =
      mode === "throw"
        ? await hexclaveServerApp.getUser({ or: "throw" })
        : await hexclaveServerApp.getUser();
  } catch (err) {
    if (mode === "throw") throw err;
    if (mode === "redirect") {
      redirect("/?auth=signin");
    }
    return null;
  }

  if (!hx) {
    if (mode === "redirect") {
      redirect("/?auth=signin");
    }
    if (mode === "throw") {
      throw new Error("UNAUTHORIZED");
    }
    return null;
  }

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
