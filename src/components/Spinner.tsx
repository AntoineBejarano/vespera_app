"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative size-14">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent)] border-r-[var(--accent-2)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[18%] overflow-hidden rounded-xl"
          animate={{ scale: [0.92, 1, 0.92], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/brand/mark.png"
            alt=""
            width={40}
            height={40}
            className="size-full object-contain"
          />
        </motion.div>
      </div>
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}

export function PageSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Spinner label={label} />
    </div>
  );
}
