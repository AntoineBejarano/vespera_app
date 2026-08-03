type MetricEvent =
  | "chat_message"
  | "character_created"
  | "character_imported"
  | "character_forked"
  | "memory_corrected"
  | "memory_deleted"
  | "daily_limit_hit"
  | "safety_block"
  | "openrouter_error"
  | "adult_approval"
  | "content_policy_deny";

const counters = new Map<string, number>();

function dayBucket() {
  return new Date().toISOString().slice(0, 10);
}

export function track(event: MetricEvent, meta?: Record<string, string>) {
  const key = `${dayBucket()}:${event}`;
  counters.set(key, (counters.get(key) ?? 0) + 1);
  console.info("[metric]", event, meta ?? {});
}

export function snapshotMetrics() {
  return Object.fromEntries(counters.entries());
}
