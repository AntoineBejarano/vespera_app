"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function RetroGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-40 [mask-image:linear-gradient(to_bottom,white,transparent)]",
        className,
      )}
      aria-hidden="true"
    >
      {/* Transform-only animation (composited) — avoid background-position jank */}
      <div className="absolute inset-0 [transform:perspective(500px)_rotateX(55deg)] [transform-origin:center_top]">
        <div className="absolute inset-[-48px_0] animate-[vespera-grid_20s_linear_infinite] bg-[linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] bg-size-[48px_48px] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export function Marquee({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="flex w-max gap-10"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        <div className="flex gap-10">{children}</div>
        <div className="flex gap-10">{children}</div>
      </motion.div>
    </div>
  );
}

/** Opacity + translate only — never filter:blur (blocks LCP / non-composited). */
export function BlurFade({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const shimmerClass =
  "relative overflow-hidden rounded-xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--accent-ink)] transition hover:opacity-95";

/** CSS shimmer (composited transform) — no motion/react infinite loop on LCP. */
export function ShimmerButton({
  children,
  className,
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent motion-safe:animate-[shimmer-x_2.2s_ease-in-out_infinite]"
        aria-hidden="true"
      />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(shimmerClass, "inline-flex items-center justify-center", className)}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(shimmerClass, className)}
    >
      {inner}
    </button>
  );
}
