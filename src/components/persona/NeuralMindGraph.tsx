"use client";

import { useEffect, useRef, useState } from "react";
import {
  MIND_UNIVERSES,
  NODE_TYPE_COLOR,
  UNIVERSE_COLOR,
  type MindGraphData,
  type MindGraphNode,
  type MindUniverse,
} from "@/lib/persona/mind-graph";

type GraphNode = MindGraphNode & {
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  radius: number;
  pulse: number;
};

type GraphLink = {
  source: string;
  target: string;
  strength: number;
};

function layoutNodes(nodes: MindGraphNode[]): GraphNode[] {
  const byUniverse = new Map<MindUniverse, MindGraphNode[]>();
  for (const n of nodes) {
    const u = n.universe;
    const list = byUniverse.get(u) ?? [];
    list.push(n);
    byUniverse.set(u, list);
  }

  const universeOrder: MindUniverse[] = [
    "self",
    "relationships",
    "memory",
    "knowledge",
    "affect",
    "intentions",
    "agency",
  ];
  const out: GraphNode[] = [];

  for (const n of nodes) {
    if (n.type === "persona") {
      out.push({
        ...n,
        baseX: 0,
        baseY: 0,
        currentX: 0,
        currentY: 0,
        radius: 18,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  universeOrder.forEach((universe, ui) => {
    const group = (byUniverse.get(universe) ?? []).filter(
      (n) => n.type !== "persona",
    );
    const ring =
      universe === "agency" ? 220 : universe === "self" ? 110 : 150 + (ui % 3) * 18;
    group.forEach((n, i) => {
      const angle =
        (i / Math.max(1, group.length)) * Math.PI * 2 +
        (ui * 0.35) +
        (universe === "agency" ? 0.2 : 0);
      const jitter = ((i % 3) - 1) * 12;
      out.push({
        ...n,
        baseX: Math.cos(angle) * (ring + jitter),
        baseY: Math.sin(angle) * (ring + jitter),
        currentX: 0,
        currentY: 0,
        radius: Math.max(6, Math.min(14, 5 + n.val * 0.35)),
        pulse: Math.random() * Math.PI * 2,
      });
    });
  });

  return out;
}

export function NeuralMindGraph({
  data,
  activeUniverse = "all",
  onUniverseChange,
  pulseUniverses = [],
  activityActive = false,
  height = 560,
  emptyHint,
}: {
  data: MindGraphData;
  activeUniverse?: MindUniverse | "all";
  onUniverseChange?: (u: MindUniverse | "all") => void;
  pulseUniverses?: MindUniverse[];
  activityActive?: boolean;
  height?: number;
  emptyHint?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    nodes: GraphNode[];
    links: GraphLink[];
    hovered: GraphNode | null;
  }>({ nodes: [], links: [], hovered: null });
  const [hoveredInfo, setHoveredInfo] = useState<{
    node: GraphNode;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [selected, setSelected] = useState<MindGraphNode | null>(null);

  useEffect(() => {
    const nodes = layoutNodes(data.nodes);
    const idSet = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = data.links
      .filter((l) => idSet.has(l.source) && idSet.has(l.target))
      .map((l) => ({
        source: l.source,
        target: l.target,
        strength: l.strength,
      }));
    stateRef.current.nodes = nodes;
    stateRef.current.links = links;
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId = 0;
    let time = 0;

    const render = () => {
      time += 0.02;
      const parent = canvas.parentElement;
      const w = (canvas.width = parent?.clientWidth ?? 800);
      const h = (canvas.height = height);
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // subtle grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const { nodes, links, hovered } = stateRef.current;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      nodes.forEach((n, i) => {
        n.pulse += 0.03;
        const floatX = Math.cos(n.pulse + i) * 4;
        const floatY = Math.sin(n.pulse * 0.8 + i) * 4;
        n.currentX = cx + n.baseX + floatX;
        n.currentY = cy + n.baseY + floatY;
      });

      links.forEach((link) => {
        const s = nodeMap.get(link.source);
        const t = nodeMap.get(link.target);
        if (!s || !t) return;

        const matches =
          activeUniverse === "all" ||
          s.universe === activeUniverse ||
          t.universe === activeUniverse;
        const pulsing =
          activityActive &&
          (pulseUniverses.includes(s.universe) ||
            pulseUniverses.includes(t.universe));

        ctx.beginPath();
        ctx.moveTo(s.currentX, s.currentY);
        ctx.lineTo(t.currentX, t.currentY);
        if (pulsing) {
          ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
          ctx.lineWidth = 1.8;
          ctx.globalAlpha = 0.85;
        } else if (matches) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.15;
        }
        ctx.stroke();

        if (pulsing) {
          const progress = (time * 1.4 + (s.baseX % 3)) % 1;
          const px = s.currentX + (t.currentX - s.currentX) * progress;
          const py = s.currentY + (t.currentY - s.currentY) * progress;
          ctx.fillStyle = "#f59e0b";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      nodes.forEach((n) => {
        const color = NODE_TYPE_COLOR[n.type] ?? "#94a3b8";
        const isFiltered =
          activeUniverse === "all" || n.universe === activeUniverse;
        const isPulsing =
          pulseUniverses.includes(n.universe) ||
          (activityActive && n.type === "persona");
        const isHovered = hovered?.id === n.id;

        ctx.globalAlpha = isFiltered ? 1 : 0.18;

        if (isPulsing || isHovered || n.type === "persona") {
          const glowSize =
            n.radius * (isPulsing ? 3.2 : 2.4) + Math.sin(n.pulse * 2) * 2;
          const grad = ctx.createRadialGradient(
            n.currentX,
            n.currentY,
            n.radius * 0.4,
            n.currentX,
            n.currentY,
            glowSize,
          );
          grad.addColorStop(0, hexGlow(color, 0.45));
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(n.currentX, n.currentY, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          n.currentX,
          n.currentY,
          n.radius + (isHovered ? 2 : 0),
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = isFiltered ? (isHovered ? 0.85 : 0.35) : 0.05;
        ctx.beginPath();
        ctx.arc(
          n.currentX,
          n.currentY,
          n.radius + (isHovered ? 2 : 0),
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (n.radius >= 8 || isHovered || isPulsing || n.type === "persona") {
          ctx.font =
            n.type === "persona"
              ? "600 12px var(--font-sans), system-ui, sans-serif"
              : "500 10px var(--font-sans), system-ui, sans-serif";
          ctx.fillStyle = isHovered
            ? "rgba(255,255,255,0.95)"
            : "rgba(232,230,227,0.8)";
          ctx.textAlign = "center";
          const label =
            n.label.length > 28 ? `${n.label.slice(0, 27)}…` : n.label;
          ctx.fillText(label, n.currentX, n.currentY + n.radius + 12);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeUniverse, pulseUniverses, activityActive, height, data]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hovered =
      stateRef.current.nodes.find((n) => {
        return Math.hypot(mx - n.currentX, my - n.currentY) <= n.radius + 6;
      }) ?? null;

    stateRef.current.hovered = hovered;
    if (hovered) {
      setHoveredInfo({ node: hovered, screenX: mx, screenY: my });
    } else {
      setHoveredInfo(null);
    }
  };

  if (!data.nodes.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground"
        style={{ height }}
      >
        {emptyHint ?? "No mind nodes yet."}
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-[var(--background)]"
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          stateRef.current.hovered = null;
          setHoveredInfo(null);
        }}
        onClick={() => {
          if (stateRef.current.hovered) {
            setSelected(stateRef.current.hovered);
          }
        }}
        className="h-full w-full cursor-pointer"
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
          <span className="size-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
          Neural mind
        </div>
        <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-card/90 p-1 backdrop-blur">
          <button
            type="button"
            onClick={() => onUniverseChange?.("all")}
            className={`rounded-full px-2.5 py-1 text-[10px] capitalize transition ${
              activeUniverse === "all"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            all
          </button>
          {MIND_UNIVERSES.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onUniverseChange?.(u)}
              className={`rounded-full px-2.5 py-1 text-[10px] capitalize transition ${
                activeUniverse === u
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                activeUniverse === u
                  ? { boxShadow: `0 0 12px ${UNIVERSE_COLOR[u]}44` }
                  : undefined
              }
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {hoveredInfo ? (
        <div
          className="pointer-events-none absolute z-20 max-w-xs -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
          style={{ left: hoveredInfo.screenX, top: hoveredInfo.screenY - 8 }}
        >
          <div className="mb-1 flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{
                backgroundColor: NODE_TYPE_COLOR[hoveredInfo.node.type],
              }}
            />
            <span className="text-xs font-semibold text-foreground">
              {hoveredInfo.node.label}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {hoveredInfo.node.detail?.slice(0, 180) ||
              hoveredInfo.node.universe}
          </p>
        </div>
      ) : null}

      {selected ? (
        <div className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-border bg-card/95 p-4 shadow-2xl backdrop-blur sm:w-80">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Node · {selected.universe}
            </span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: NODE_TYPE_COLOR[selected.type] }}
            />
            <h3 className="text-sm font-semibold text-foreground">
              {selected.label}
            </h3>
          </div>
          <p className="flex-1 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {selected.detail || "No detail."}
          </p>
          {selected.updatedAt ? (
            <p className="mt-3 text-[10px] text-muted-foreground">
              Updated {new Date(selected.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function hexGlow(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
