"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TypingAnimation({
  children = "typing",
  className,
  typeSpeed = 70,
}: {
  children?: string;
  className?: string;
  typeSpeed?: number;
}) {
  const [shown, setShown] = useState("");
  const [i, setI] = useState(0);

  useEffect(() => {
    setShown("");
    setI(0);
  }, [children]);

  useEffect(() => {
    if (i >= children.length) return;
    const t = setTimeout(() => {
      setShown(children.slice(0, i + 1));
      setI(i + 1);
    }, typeSpeed);
    return () => clearTimeout(t);
  }, [i, children, typeSpeed]);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span>{shown}</span>
      <span className="inline-block h-3 w-1.5 animate-pulse bg-[var(--accent)]" />
    </span>
  );
}
