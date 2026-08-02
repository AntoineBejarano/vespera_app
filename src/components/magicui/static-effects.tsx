import { cn } from "@/lib/utils";

/** Server-safe retro grid — transform-only CSS animation. */
export function RetroGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-40 [mask-image:linear-gradient(to_bottom,white,transparent)]",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 [transform:perspective(500px)_rotateX(55deg)] [transform-origin:center_top]">
        <div className="absolute inset-[-48px_0] animate-[vespera-grid_20s_linear_infinite] bg-[linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] bg-size-[48px_48px] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

const shimmerClass =
  "relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--accent-ink)] transition hover:opacity-95";

/** Plain anchor CTA — no next/link client boundary. */
export function ShimmerLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={cn(shimmerClass, className)}>
      <span className="relative z-10">{children}</span>
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent motion-safe:animate-[shimmer-x_2.2s_ease-in-out_infinite]"
        aria-hidden="true"
      />
    </a>
  );
}
