import { z } from "zod";
import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { deleteWorkspace } from "@/lib/workspace/ownership";
import {
  requireWorkspacePermission,
  workspaceAuthResponse,
} from "@/lib/workspace/permissions";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  /** Rejected — adult enablement is ops-only via AdultWorkspaceApproval. */
  adultEnabled: z.boolean().optional(),
});

const deleteSchema = z.object({
  confirmName: z.string().min(1),
});

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: workspaceId } = await params;

  try {
    await requireWorkspacePermission(user.id, workspaceId, "workspace.read");
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ workspace });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: workspaceId } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    if (parsed.data.adultEnabled !== undefined) {
      return Response.json(
        {
          error:
            "After Dark partner access cannot be self-enabled. Contact partners@vesperer.com.",
          code: "ADULT_SELF_ENABLE_FORBIDDEN",
        },
        { status: 403 },
      );
    }
    if (parsed.data.name !== undefined) {
      await requireWorkspacePermission(
        user.id,
        workspaceId,
        "workspace.update",
      );
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      },
    });
    return Response.json({ workspace });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: workspaceId } = await params;
  const url = new URL(req.url);
  const body = await req.json().catch(() => null);
  const confirmName =
    (typeof body?.confirmName === "string" && body.confirmName) ||
    url.searchParams.get("confirmName") ||
    "";
  const parsed = deleteSchema.safeParse({ confirmName });
  if (!parsed.success) {
    return Response.json(
      { error: "confirmName required (type DELETE or the workspace name)" },
      { status: 400 },
    );
  }

  try {
    await deleteWorkspace({
      actorUserId: user.id,
      workspaceId,
      confirmName: parsed.data.confirmName,
    });
    return Response.json({ ok: true });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    const message = err instanceof Error ? err.message : "Could not delete";
    console.error("[workspaces.delete]", workspaceId, err);
    return Response.json({ error: message }, { status: 500 });
  }
}
