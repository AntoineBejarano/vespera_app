"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { BrandVariant } from "@/components/BrandLogo";

const MARK_SRC: Record<BrandVariant, string> = {
  default: "/brand/mark.png",
  "after-dark": "/brand/mark-after-dark.png",
};

export function Spinner({
  className,
  label = "Loading",
  variant = "default",
  showWordmark = true,
}: {
  className?: string;
  label?: string;
  variant?: BrandVariant;
  showWordmark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex size-28 items-center justify-center sm:size-32">
        {/* Soft bloom */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-[-20%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--accent) 35%, transparent) 0%, transparent 68%)",
          }}
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Outer orbit */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, var(--accent) 18%, transparent 36%, transparent 55%, var(--accent-2) 72%, transparent 88%)",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        />

        {/* Mid orbit — reverse */}
        <motion.span
          aria-hidden
          className="absolute inset-[12%] rounded-full border border-[var(--accent)]/15"
        />
        <motion.span
          aria-hidden
          className="absolute inset-[12%] rounded-full"
          style={{
            background:
              "conic-gradient(from 180deg, transparent 0%, var(--accent-2) 12%, transparent 28%)",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner dashed ring */}
        <motion.span
          aria-hidden
          className="absolute inset-[24%] rounded-full border border-dashed border-[var(--accent)]/25"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Orbiting spark */}
        <motion.span
          aria-hidden
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        >
          <span
            className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-2)]"
            style={{
              boxShadow:
                "0 0 10px 2px color-mix(in oklab, var(--accent) 70%, transparent)",
            }}
          />
        </motion.span>

        {/* Logo mark */}
        <motion.div
          className="relative z-10 size-[42%] sm:size-[44%]"
          animate={{
            scale: [0.94, 1.04, 0.94],
            filter: [
              "drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 35%, transparent))",
              "drop-shadow(0 0 16px color-mix(in oklab, var(--accent) 70%, transparent))",
              "drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 35%, transparent))",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={MARK_SRC[variant]}
            alt=""
            width={64}
            height={64}
            priority
            className="size-full object-contain"
          />
        </motion.div>
      </div>

      {showWordmark ? (
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-xl">
            Vesper
            <span
              className={
                variant === "after-dark"
                  ? "text-[var(--accent)]"
                  : "text-[var(--accent-2)]"
              }
            >
              er
            </span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--muted)]">
              {label}
            </span>
            <span className="flex gap-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1 rounded-full bg-[var(--accent)]"
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                  transition={{
                    duration: 1.05,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.18,
                  }}
                />
              ))}
            </span>
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--muted)]">
            {label}
          </span>
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1 rounded-full bg-[var(--accent)]"
                animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                transition={{
                  duration: 1.05,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.18,
                }}
              />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

export function PageSpinner({
  label = "Loading",
  variant = "default",
}: {
  label?: string;
  variant?: BrandVariant;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 45%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)",
        }}
      />
      <Spinner label={label} variant={variant} />
    </div>
  );
}
