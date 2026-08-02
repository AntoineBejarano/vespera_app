/** Lightweight route loading UI — no motion/Hexclave. */
export default function Loading() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div
        className="size-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)] motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="text-sm text-[var(--muted)]">Loading</span>
    </div>
  );
}
