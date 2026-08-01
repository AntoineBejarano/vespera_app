import { requireAccountApiKey } from "@/lib/api-keys/require-account-key";
import { importPersonaFromBody } from "@/lib/personas/import";

export const maxDuration = 60;

/** Import a Character Card / SillyTavern export into a persona you own. */
export async function POST(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "import" });
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }

  const result = await importPersonaFromBody(auth.user, body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(
    {
      persona: {
        id: result.character.id,
        name: result.character.name,
        chatApiKey: result.character.chatApiKey,
        warnings: result.character.warnings,
      },
    },
    { status: 201 },
  );
}
