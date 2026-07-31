import { getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import {
  createUserApiKey,
  listUserApiKeys,
} from "@/lib/api-keys/user-keys";

export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const keys = await listUserApiKeys(user.id);
  return Response.json({ keys });
}

export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (needsAccountAgeGate(user)) {
    return Response.json({ error: "Age verification 18+ required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "cli").slice(0, 60);
  const created = await createUserApiKey(user.id, name);

  return Response.json({
    key: {
      id: created.id,
      name: created.name,
      keyPrefix: created.keyPrefix,
      /** Shown once — store it. */
      secret: created.secret,
    },
  });
}
