import { getAppUser } from "@/lib/session";
import { revokeUserApiKey } from "@/lib/api-keys/user-keys";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await revokeUserApiKey(user.id, id);
  if (!ok) {
    return Response.json({ error: "Key not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
