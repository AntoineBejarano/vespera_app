"use client";

import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type RefAttributes,
} from "react";
import {
  motion,
  useInView,
  type DOMMotionComponents,
  type HTMLMotionProps,
  type MotionProps,
} from "motion/react";
import { cn } from "@/lib/utils";

interface SequenceContextValue {
  completeItem: (index: number) => void;
  activeIndex: number;
  sequenceStarted: boolean;
}

const SequenceContext = createContext<SequenceContextValue | null>(null);
const useSequence = () => useContext(SequenceContext);

const ItemIndexContext = createContext<number | null>(null);
const useItemIndex = () => useContext(ItemIndexContext);

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
} as const;

type MotionElementType = Extract<
  keyof DOMMotionComponents,
  keyof typeof motionElements
>;
type TerminalTypingMotionComponent = ComponentType<
  Omit<HTMLMotionProps<"span">, "ref"> & RefAttributes<HTMLElement>
>;

interface AnimatedSpanProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  startOnView?: boolean;
}

export const AnimatedSpan = ({
  children,
  delay = 0,
  className,
  startOnView = false,
  ...props
}: AnimatedSpanProps) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(elementRef as React.RefObject<Element>, {
    amount: 0.3,
    once: true,
  });

  const sequence = useSequence();
  const itemIndex = useItemIndex();

  const shouldAnimate = sequence
    ? sequence.sequenceStarted &&
      itemIndex !== null &&
      sequence.activeIndex >= itemIndex
    : startOnView
      ? isInView
      : true;

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, y: -5 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -5 }}
      transition={{ duration: 0.3, delay: sequence ? 0 : delay / 1000 }}
      className={cn("grid text-sm font-normal tracking-tight", className)}
      onAnimationComplete={() => {
        if (!sequence) return;
        if (itemIndex === null) return;
        if (sequence.activeIndex === itemIndex) {
          sequence.completeItem(itemIndex);
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface TerminalTypingProps extends Omit<MotionProps, "children"> {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: MotionElementType;
  startOnView?: boolean;
}

/** Typing line for Terminal sequences (distinct from chat TypingAnimation). */
export const TerminalTyping = ({
  children,
  className,
  duration = 40,
  delay = 0,
  as: Component = "span",
  startOnView = true,
  ...props
}: TerminalTypingProps) => {
  if (typeof children !== "string") {
    throw new Error("TerminalTyping: children must be a string.");
  }

  const MotionComponent = motionElements[
    Component
  ] as TerminalTypingMotionComponent;

  const [displayedText, setDisplayedText] = useState("");
  const elementRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(elementRef as React.RefObject<Element>, {
    amount: 0.3,
    once: true,
  });

  const sequence = useSequence();
  const itemIndex = useItemIndex();
  const hasSequence = sequence !== null;
  const sequenceStarted = sequence?.sequenceStarted ?? false;
  const sequenceActiveIndex = sequence?.activeIndex ?? null;

  const shouldStart = hasSequence
    ? sequenceStarted &&
      itemIndex !== null &&
      sequenceActiveIndex === itemIndex
    : !startOnView || isInView;

  useEffect(() => {
    if (!shouldStart) return;

    let cancelled = false;
    let i = 0;
    let typingEffect: ReturnType<typeof setInterval> | null = null;
    const completeItem = sequence?.completeItem;
    const currentItemIndex = itemIndex;

    const kickoff = setTimeout(
      () => {
        typingEffect = setInterval(() => {
          if (cancelled) return;
          if (i < children.length) {
            i += 1;
            setDisplayedText(children.substring(0, i));
            return;
          }
          if (typingEffect) {
            clearInterval(typingEffect);
            typingEffect = null;
          }
          if (completeItem && currentItemIndex !== null) {
            completeItem(currentItemIndex);
          }
        }, duration);
      },
      hasSequence ? 0 : delay,
    );

    return () => {
      cancelled = true;
      clearTimeout(kickoff);
      if (typingEffect) clearInterval(typingEffect);
    };
  }, [
    shouldStart,
    children,
    duration,
    delay,
    hasSequence,
    sequence?.completeItem,
    itemIndex,
  ]);

  return (
    <MotionComponent
      ref={elementRef}
      className={cn("text-sm font-normal tracking-tight", className)}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  );
};

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
  sequence?: boolean;
  startOnView?: boolean;
  title?: string;
}

export const Terminal = ({
  children,
  className,
  sequence = true,
  startOnView = true,
  title = "vesperer · claude",
}: TerminalProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef as React.RefObject<Element>, {
    amount: 0.25,
    once: true,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const sequenceHasStarted = sequence ? !startOnView || isInView : false;

  const contextValue = useMemo<SequenceContextValue | null>(() => {
    if (!sequence) return null;
    return {
      completeItem: (index: number) => {
        setActiveIndex((current) =>
          index === current ? current + 1 : current,
        );
      },
      activeIndex,
      sequenceStarted: sequenceHasStarted,
    };
  }, [sequence, activeIndex, sequenceHasStarted]);

  const wrappedChildren = useMemo(() => {
    if (!sequence) return children;
    const array = Children.toArray(children);
    return array.map((child, index) => (
      <ItemIndexContext.Provider key={index} value={index}>
        {child as React.ReactNode}
      </ItemIndexContext.Provider>
    ));
  }, [children, sequence]);

  const content = (
    <div
      ref={containerRef}
      className={cn(
        "z-0 h-full w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[0_24px_80px_-40px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
        <div className="flex flex-row gap-x-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <p className="truncate font-mono text-[11px] text-[var(--muted)]">
          {title}
        </p>
      </div>
      <pre className="max-h-[28rem] overflow-auto p-4 sm:p-5">
        <code className="grid gap-y-1.5 overflow-auto font-mono text-[13px] leading-relaxed">
          {wrappedChildren}
        </code>
      </pre>
    </div>
  );

  if (!sequence) return content;

  return (
    <SequenceContext.Provider value={contextValue}>
      {content}
    </SequenceContext.Provider>
  );
};
