import { z } from "zod";
import { getAppUser } from "@/lib/session";
import { isSuperadminUser } from "@/lib/platform/superadmin";
import {
  AdultApprovalError,
  approveAdultWorkspace,
  revokeAdultWorkspace,
} from "@/lib/adult/approval";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const approveSchema = z.object({
  reason: z.string().min(8).max(2000),
  capabilities: z
    .array(z.enum(["chat_adult", "image_explicit", "voice_adult", "persona_adult_config", "publish_adult"]))
    .optional(),
  allowedCountries: z.array(z.string().length(2)).optional(),
  ageAssuranceRequired: z.boolean().optional(),
  ageAssuranceProvider: z.string().max(80).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const revokeSchema = z.object({
  reason: z.string().min(4).max(2000),
});

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user || !isSuperadminUser(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId } = await params;
  const [workspace, approvals] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.adultWorkspaceApproval.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  if (!workspace) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ workspace, approvals });
}

export async function POST(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user || !isSuperadminUser(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId } = await params;
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "approve";

  try {
    if (action === "revoke") {
      const parsed = revokeSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: "Invalid data" }, { status: 400 });
      }
      await revokeAdultWorkspace({
        workspaceId,
        actor: user,
        reason: parsed.data.reason,
      });
      return Response.json({ ok: true, status: "revoked" });
    }

    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid data" }, { status: 400 });
    }
    const approval = await approveAdultWorkspace({
      workspaceId,
      actor: user,
      reason: parsed.data.reason,
      capabilities: parsed.data.capabilities,
      allowedCountries: parsed.data.allowedCountries,
      ageAssuranceRequired: parsed.data.ageAssuranceRequired,
      ageAssuranceProvider: parsed.data.ageAssuranceProvider,
      expiresAt: parsed.data.expiresAt
        ? new Date(parsed.data.expiresAt)
        : null,
    });
    return Response.json({ ok: true, approval });
  } catch (err) {
    if (err instanceof AdultApprovalError) {
      return Response.json(
        { error: err.message },
        { status: err.status },
      );
    }
    throw err;
  }
}
