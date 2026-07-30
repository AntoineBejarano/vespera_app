import { auth } from "@/lib/auth";
import { snapshotMetrics } from "@/lib/metrics";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  return Response.json({
    day: new Date().toISOString().slice(0, 10),
    counters: snapshotMetrics(),
  });
}
