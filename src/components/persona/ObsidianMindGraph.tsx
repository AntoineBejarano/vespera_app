"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import {
  NODE_TYPE_COLOR,
  type MindGraphData,
  type MindGraphNode,
  type MindNodeType,
} from "@/lib/persona/mind-graph";

const FILTER_TYPES: MindNodeType[] = [
  "layer",
  "knowledge",
  "belief",
  "memory",
  "preference",
  "person",
  "event",
  "source",
  "concept",
  "note",
  "tag",
  "channel",
  "relationship",
];

function isRecent(iso?: string) {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 1000 * 60 * 60 * 24 * 14;
}

function hexToRgba(hex: string, alpha: number) {
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

export function ObsidianMindGraph({
  data,
  height = 560,
  emptyHint,
}: {
  data: MindGraphData;
  height?: number;
  emptyHint?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const layoutRef = useRef<FA2Layout | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const hoverRef = useRef<string | null>(null);
  const queryRef = useRef("");

  const [selected, setSelected] = useState<MindGraphNode | null>(null);
  const [query, setQuery] = useState("");
  const [hiddenTypes, setHiddenTypes] = useState<Set<MindNodeType>>(new Set());
  const [hideWeak, setHideWeak] = useState(false);
  const [sourcesOnly, setSourcesOnly] = useState(false);

  const nodeById = useMemo(() => {
    const m = new Map<string, MindGraphNode>();
    for (const n of data.nodes) m.set(n.id, n);
    return m;
  }, [data.nodes]);

  // Build graph + Sigma once per data/filter change (not on hover)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    layoutRef.current?.kill();
    layoutRef.current = null;
    sigmaRef.current?.kill();
    sigmaRef.current = null;

    if (!data.nodes.length) {
      graphRef.current = null;
      return;
    }

    const graph = new Graph();

    for (const n of data.nodes) {
      if (n.type === "ignore") continue;
      if (n.type !== "persona" && hiddenTypes.has(n.type)) continue;
      if (
        sourcesOnly &&
        !["source", "knowledge", "persona", "layer"].includes(n.type)
      ) {
        continue;
      }
      if (hideWeak && n.confidence < 0.55 && n.type === "concept") continue;

      const angle = (graph.order / Math.max(data.nodes.length, 1)) * Math.PI * 2;
      graph.addNode(n.id, {
        label: n.label,
        x: Math.cos(angle) * 60 + (Math.random() - 0.5) * 10,
        y: Math.sin(angle) * 60 + (Math.random() - 0.5) * 10,
        size: Math.max(3, Math.sqrt(n.val) * 1.85) + (isRecent(n.updatedAt) ? 2 : 0),
        color: NODE_TYPE_COLOR[n.type] ?? "#8b9bb4",
        nodeType: n.type,
        confidence: n.confidence,
        recent: isRecent(n.updatedAt),
      });
    }

    for (const l of data.links) {
      if (!graph.hasNode(l.source) || !graph.hasNode(l.target)) continue;
      if (graph.hasEdge(l.source, l.target) || graph.hasEdge(l.target, l.source)) {
        continue;
      }
      graph.addEdge(l.source, l.target, {
        size: 0.35 + l.strength * 2.4,
        color: l.uncertain
          ? "rgba(148,163,184,0.22)"
          : "rgba(148,163,184,0.42)",
        uncertain: Boolean(l.uncertain),
        label: l.label ?? "",
      });
    }

    graphRef.current = graph;

    forceAtlas2.assign(graph, {
      iterations: 50,
      settings: {
        gravity: 1.15,
        scalingRatio: 12,
        strongGravityMode: true,
        slowDown: 5,
      },
    });

    const sigma = new Sigma(graph, el, {
      allowInvalidContainer: true,
      renderEdgeLabels: false,
      labelFont: "ui-sans-serif, system-ui, sans-serif",
      labelSize: 11,
      labelWeight: "500",
      labelColor: { color: "rgba(232,230,227,0.9)" },
      stagePadding: 48,
    });

    const refreshReducers = () => {
      sigma.setSetting("nodeReducer", (node, attrs) => {
        const res = { ...attrs };
        const conf = Number(attrs.confidence ?? 1);
        const base = String(attrs.color ?? "#8b9bb4");
        const alpha = 0.32 + conf * 0.68;
        res.color = base.startsWith("#") ? hexToRgba(base, alpha) : base;

        const h = hoverRef.current;
        const q = queryRef.current.trim().toLowerCase();

        if (h) {
          const keep =
            node === h ||
            graph.hasEdge(h, node) ||
            graph.hasEdge(node, h) ||
            graph.areNeighbors(h, node);
          if (!keep) {
            res.color = "rgba(71,85,105,0.14)";
            res.label = "";
            res.zIndex = 0;
          } else {
            res.zIndex = 2;
            if (node === h && attrs.recent) {
              res.color = hexToRgba("#5badee", 0.95);
            }
          }
        }

        if (q) {
          const label = String(attrs.label ?? "").toLowerCase();
          if (!label.includes(q) && String(attrs.nodeType) !== "persona") {
            if (!h) {
              res.color = "rgba(71,85,105,0.1)";
              res.label = "";
            }
          }
        }
        return res;
      });

      sigma.setSetting("edgeReducer", (edge, attrs) => {
        const res = { ...attrs };
        const h = hoverRef.current;
        if (h) {
          const [a, b] = graph.extremities(edge);
          if (a !== h && b !== h) {
            res.hidden = true;
          } else {
            res.hidden = false;
            res.color = "rgba(91,173,238,0.6)";
            res.size = Number(attrs.size ?? 1) * 1.4;
          }
        } else if (attrs.uncertain) {
          res.color = "rgba(148,163,184,0.2)";
        }
        return res;
      });

      sigma.refresh();
    };

    refreshReducers();

    sigma.on("clickNode", ({ node }) => {
      setSelected(nodeById.get(node) ?? null);
    });
    sigma.on("clickStage", () => setSelected(null));
    sigma.on("enterNode", ({ node }) => {
      hoverRef.current = node;
      refreshReducers();
    });
    sigma.on("leaveNode", () => {
      hoverRef.current = null;
      refreshReducers();
    });

    sigmaRef.current = sigma;

    const layout = new FA2Layout(graph, {
      settings: {
        gravity: 1,
        scalingRatio: 15,
        strongGravityMode: true,
        slowDown: 7,
        barnesHutOptimize: graph.order > 100,
      },
    });
    layout.start();
    layoutRef.current = layout;
    const stopTimer = window.setTimeout(() => {
      layout.stop();
      try {
        sigma.getCamera().animatedReset({ duration: 450 });
      } catch {
        /* ignore */
      }
    }, 3000);

    return () => {
      window.clearTimeout(stopTimer);
      layout.kill();
      sigma.kill();
      layoutRef.current = null;
      sigmaRef.current = null;
      graphRef.current = null;
    };
  }, [data, hiddenTypes, hideWeak, sourcesOnly, nodeById]);

  // Query changes → refresh reducers only
  useEffect(() => {
    queryRef.current = query;
    const s = sigmaRef.current;
    if (!s) return;
    s.setSetting("labelRenderedSizeThreshold", query ? 0 : 8);
    s.refresh();
  }, [query]);

  function toggleType(t: MindNodeType) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  if (!data.nodes.length) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[#0b0d10]"
        style={{ height }}
      >
        <p className="max-w-sm px-6 text-center text-sm text-[var(--muted)]">
          {emptyHint ??
            "No mind nodes yet — write identity layers or connect an Obsidian vault."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search mind…"
          className="min-w-[160px] flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm sm:max-w-xs"
        />
        <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <input
            type="checkbox"
            checked={hideWeak}
            onChange={(e) => setHideWeak(e.target.checked)}
          />
          Hide weak concepts
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <input
            type="checkbox"
            checked={sourcesOnly}
            onChange={(e) => setSourcesOnly(e.target.checked)}
          />
          Confirmed sources only
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTER_TYPES.map((t) => {
          const on = !hiddenTypes.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className={
                on
                  ? "rounded-full border px-2.5 py-0.5 text-[11px]"
                  : "rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[11px] opacity-35"
              }
              style={
                on
                  ? {
                      borderColor: NODE_TYPE_COLOR[t],
                      color: NODE_TYPE_COLOR[t],
                    }
                  : undefined
              }
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div
          className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[#0b0d10]"
          style={{ height }}
        >
          <div ref={containerRef} className="h-full w-full" />
          <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60 backdrop-blur">
            Sigma · ForceAtlas2 · {data.nodes.length} nodes · {data.links.length}{" "}
            edges
          </div>
        </div>

        <aside className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/50 p-4">
          {selected ? (
            <div className="space-y-2">
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: NODE_TYPE_COLOR[selected.type] }}
              >
                {selected.type}
                {selected.private ? " · private" : ""}
              </p>
              <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                {selected.label}
              </h3>
              {selected.detail ? (
                <p className="max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
                  {selected.detail}
                </p>
              ) : null}
              <dl className="space-y-1 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
                <div className="flex justify-between gap-2">
                  <dt>Confidence</dt>
                  <dd className="text-[var(--ink)]">
                    {Math.round(selected.confidence * 100)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Importance</dt>
                  <dd className="text-[var(--ink)]">
                    {selected.val.toFixed(1)}
                  </dd>
                </div>
                {selected.sourcePath ? (
                  <div className="flex justify-between gap-2">
                    <dt>Path</dt>
                    <dd className="max-w-[160px] truncate text-[var(--ink)]">
                      {selected.sourcePath}
                    </dd>
                  </div>
                ) : null}
                {selected.provenance ? (
                  <div>
                    <dt className="mb-0.5">Provenance</dt>
                    <dd className="text-[var(--ink)]">{selected.provenance}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                Give your AI the structure of your mind
              </p>
              <p>
                Color = type · size = importance · intensity = confidence ·
                faint edges = uncertain · larger nodes = recent.
              </p>
              <p className="text-xs">
                Hover isolates neighbors. Click opens provenance. Notes are
                classified — not every file becomes a memory.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
