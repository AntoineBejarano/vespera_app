"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { AnimatePresence, motion, type MotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations: MotionProps = {
    initial: { scale: 0.96, opacity: 0, y: 8 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.96, opacity: 0 },
    transition: { type: "spring", stiffness: 380, damping: 32 },
  };

  return (
    <motion.div {...animations} layout className="w-full">
      {children}
    </motion.div>
  );
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  delay?: number;
  /** When true, show all children immediately (live chat). */
  instant?: boolean;
}

export const AnimatedList = React.memo(
  ({
    children,
    className,
    delay = 80,
    instant = false,
    ...props
  }: AnimatedListProps) => {
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children],
    );
    const [index, setIndex] = useState(
      instant ? Math.max(childrenArray.length - 1, 0) : 0,
    );

    useEffect(() => {
      if (instant) {
        setIndex(Math.max(childrenArray.length - 1, 0));
        return;
      }
      if (index >= childrenArray.length - 1) return;
      const timeout = setTimeout(() => setIndex((i) => i + 1), delay);
      return () => clearTimeout(timeout);
    }, [index, delay, childrenArray.length, instant]);

    useEffect(() => {
      if (instant) setIndex(Math.max(childrenArray.length - 1, 0));
    }, [childrenArray.length, instant]);

    const itemsToShow = useMemo(() => {
      if (instant) return childrenArray;
      return childrenArray.slice(0, index + 1);
    }, [index, childrenArray, instant]);

    return (
      <div className={cn("flex w-full flex-col gap-3", className)} {...props}>
        <AnimatePresence initial={false}>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as React.ReactElement).key}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  },
);

AnimatedList.displayName = "AnimatedList";
