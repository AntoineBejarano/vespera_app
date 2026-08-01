import { z } from "zod";
import { getAppUser } from "@/lib/session";
import {
  acceptOwnershipTransfer,
  startOwnershipTransfer,
} from "@/lib/workspace/ownership";
import { workspaceAuthResponse } from "@/lib/workspace/permissions";

type Params = { params: Promise<{ id: string }> };

const startSchema = z.object({
  toUserId: z.string().min(1),
});

const acceptSchema = z.object({
  token: z.string().min(1),
});

/** Start ownership transfer (Owner only). Recipient must accept. */
export async function POST(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: workspaceId } = await params;
  const body = await req.json().catch(() => ({}));

  if (body.token) {
    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "token required" }, { status: 400 });
    }
    try {
      const result = await acceptOwnershipTransfer({
        token: parsed.data.token,
        userId: user.id,
      });
      return Response.json({ ok: true, ...result });
    } catch (err) {
      const res = workspaceAuthResponse(err);
      if (res) return res;
      throw err;
    }
  }

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "toUserId required" }, { status: 400 });
  }

  try {
    const transfer = await startOwnershipTransfer({
      actorUserId: user.id,
      workspaceId,
      toUserId: parsed.data.toUserId,
    });
    return Response.json({
      transfer: {
        id: transfer.id,
        token: transfer.token,
        expiresAt: transfer.expiresAt,
        toUserId: transfer.toUserId,
      },
    });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}
