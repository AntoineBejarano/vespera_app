import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const BRAND_NAME = "vesperer.com";
export const BRAND_SHORT = "vesperer";

export function BrandMark({
  size = 36,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-lg object-cover", className)}
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
}: {
  href?: string;
  size?: "sm" | "md" | "lg" | "hero";
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
}) {
  const mark =
    size === "hero" ? 56 : size === "lg" ? 44 : size === "sm" ? 28 : 34;
  const word =
    size === "hero"
      ? "text-3xl sm:text-5xl"
      : size === "lg"
        ? "text-2xl"
        : size === "sm"
          ? "text-base"
          : "text-lg sm:text-xl";

  const inner = (
    <>
      <BrandMark size={mark} priority={priority} className="shrink-0" />
      {showWordmark ? (
        <span className="min-w-0">
          <span
            className={cn(
              "block font-[family-name:var(--font-display)] font-semibold tracking-tight text-[var(--ink)]",
              word,
            )}
          >
            vesperer
            <span className="text-[var(--accent)]">.com</span>
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
