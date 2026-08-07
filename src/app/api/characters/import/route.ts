import { getAppUser } from "@/lib/session";
import { importPersonaFromBody } from "@/lib/personas/import";

export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const result = await importPersonaFromBody(user, body);
  if (!result.ok) {
    if (result.paywall) {
      return Response.json(result.paywall, { status: result.status });
    }
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    character: {
      id: result.character.id,
      name: result.character.name,
      warnings: result.character.warnings,
    },
  });
}
