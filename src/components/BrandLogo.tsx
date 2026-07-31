import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const BRAND_NAME = "vesperer.com";
export const BRAND_SHORT = "vesperer";

export type BrandVariant = "default" | "after-dark";

const LOGO_SRC: Record<BrandVariant, string> = {
  default: "/brand/logo.png",
  "after-dark": "/brand/logo-after-dark.png",
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
      src={LOGO_SRC[variant]}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cn(
        "rounded-lg object-cover",
        variant === "default" && "bg-[#07090d]",
        className,
      )}
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
      ? "text-3xl sm:text-5xl"
      : size === "lg"
        ? "text-2xl"
        : size === "sm"
          ? "text-base"
          : "text-lg sm:text-xl";

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
              "block font-[family-name:var(--font-display)] font-semibold tracking-tight text-[var(--ink)]",
              word,
            )}
          >
            vesperer
            <span className="text-[var(--accent-2)]">.com</span>
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
