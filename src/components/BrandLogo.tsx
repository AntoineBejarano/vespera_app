import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const BRAND_NAME = "Vesperer";
export const BRAND_SHORT = "vesperer";

export type BrandVariant = "default" | "after-dark";

/** Tight crops — full logo.png has too much padding and disappears in the nav. */
const MARK_SRC: Record<BrandVariant, string> = {
  default: "/brand/mark.png",
  "after-dark": "/brand/mark-after-dark.png",
};

export function BrandMark({
  size = 36,
  className,
  priority = false,
  variant = "default",
}: {
  size?: number;
  className?: string;
  priority?: boolean;
  variant?: BrandVariant;
}) {
  return (
    <Image
      src={MARK_SRC[variant]}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

export function BrandLogo({
  href = "/",
  size = "md",
  showWordmark = true,
  subtitle,
  className,
  onClick,
  priority = false,
  variant = "default",
}: {
  href?: string;
  size?: "sm" | "md" | "lg" | "hero";
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
  variant?: BrandVariant;
}) {
  const mark =
    size === "hero" ? 56 : size === "lg" ? 44 : size === "sm" ? 28 : 34;
  const word =
    size === "hero"
      ? "text-3xl tracking-[-0.03em] sm:text-5xl"
      : size === "lg"
        ? "text-2xl tracking-[-0.02em]"
        : size === "sm"
          ? "text-base tracking-[-0.01em]"
          : "text-lg tracking-[-0.02em] sm:text-xl";

  const accentClass =
    variant === "after-dark"
      ? "text-[var(--accent)]"
      : "text-[var(--accent-2)]";

  const inner = (
    <>
      <BrandMark
        size={mark}
        priority={priority}
        variant={variant}
        className="shrink-0"
      />
      {showWordmark ? (
        <span className="min-w-0">
          <span
            className={cn(
              "block font-[family-name:var(--font-display)] font-semibold text-[var(--ink)]",
              word,
            )}
          >
            Vesper
            <span className={accentClass}>er</span>
          </span>
          {subtitle ? (
            <span className="mt-0.5 block text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] sm:text-xs">
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2.5 sm:gap-3",
        className,
      )}
      aria-label={BRAND_NAME}
    >
      {inner}
    </Link>
  );
}
