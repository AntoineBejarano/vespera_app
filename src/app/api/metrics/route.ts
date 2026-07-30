import { snapshotMetrics } from "@/lib/metrics";
import { requireAppUser, getAppUser } from "@/lib/session";

export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  return Response.json({
    day: new Date().toISOString().slice(0, 10),
    counters: snapshotMetrics(),
  });
}
