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
    if (parsed.data.name !== undefined) {
      await requireWorkspacePermission(
        user.id,
        workspaceId,
        "workspace.update",
      );
    }
    if (parsed.data.adultEnabled !== undefined) {
      await requireWorkspacePermission(
        user.id,
        workspaceId,
        "adult.enable_workspace",
      );
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.adultEnabled !== undefined
          ? { adultEnabled: parsed.data.adultEnabled }
          : {}),
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
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "confirmName required (exact workspace name)" },
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
    throw err;
  }
}
