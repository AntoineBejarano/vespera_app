import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hexclaveServerApp } from "@/hexclave/server";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { ensurePersonalWorkspace } from "@/lib/workspace/ensure";

/** Hexclave refresh cookies look like `stack-refresh-<projectId>--…`. */
async function hasLikelyHexclaveSession() {
  const jar = await cookies();
  return jar.getAll().some(
    (c) =>
      c.name.includes("stack-refresh") ||
      c.name.startsWith("stack-") ||
      c.name.includes("hexclave"),
  );
}

/**
 * Resolve IdP session (Hexclave v1) → local Prisma User.
 * Ensures a personal Workspace (Owner) for non-peer users.
 *
 * Never use Hexclave's `{ or: "redirect" }` on the server — it can throw
 * HexclaveAssertionError. Send unauthenticated users to the same-domain handler.
 */
export async function getAppUser(opts?: {
  or?: "redirect" | "throw" | "return-null";
}) {
  const mode = opts?.or ?? "return-null";

  // Anonymous fast path: skip IdP round-trip when no session cookie (homepage TTFB).
  if (mode === "return-null" && !(await hasLikelyHexclaveSession())) {
    return null;
  }

  let hx;
  try {
    hx =
      mode === "throw"
        ? await hexclaveServerApp.getUser({ or: "throw" })
        : await hexclaveServerApp.getUser();
  } catch (err) {
    if (mode === "throw") throw err;
    if (mode === "redirect") {
      redirect("/handler/sign-in");
    }
    return null;
  }

  if (!hx) {
    if (mode === "redirect") {
      redirect("/handler/sign-in");
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
        { externalAuthUserId: hexclaveId },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        hexclaveId,
        externalAuthUserId: hexclaveId,
        authProvider: "hexclave",
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
  } else if (
    !user.hexclaveId ||
    user.hexclaveId !== hexclaveId ||
    user.externalAuthUserId !== hexclaveId
  ) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        hexclaveId,
        externalAuthUserId: hexclaveId,
        authProvider: user.authProvider ?? "hexclave",
        name: user.name || hx.displayName || user.name,
        email: email ?? user.email,
      },
    });
  }

  if (!user.isTelegramPeer) {
    await ensurePersonalWorkspace(user);
    user =
      (await prisma.user.findUnique({ where: { id: user.id } })) ?? user;
  }

  return user;
}

export async function requireAppUser() {
  const user = await getAppUser({ or: "throw" });
  if (!user) throw new Error("UNAUTHORIZED");
  if (needsAccountAgeGate(user)) throw new Error("AGE_NOT_VERIFIED");
  return user;
}
