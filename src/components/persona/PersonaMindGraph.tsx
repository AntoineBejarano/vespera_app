"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";

type GraphNodeKind =
  | "persona"
  | "layer"
  | "memoryType"
  | "memory"
  | "relationship"
  | "bot"
  | "peer"
  | "knowledge";

type ApiNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  detail?: string | null;
  meta?: Record<string, string | number | boolean | null>;
};

type ApiEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

type MindNodeData = {
  kind: GraphNodeKind;
  label: string;
  detail?: string | null;
  meta?: Record<string, string | number | boolean | null>;
};

const KIND_STYLE: Record<
  GraphNodeKind,
  { ring: string; bg: string; text: string }
> = {
  persona: {
    ring: "border-[var(--accent)]",
    bg: "bg-[var(--accent-soft)]",
    text: "text-[var(--accent)]",
  },
  layer: {
    ring: "border-sky-400/50",
    bg: "bg-sky-500/10",
    text: "text-sky-200",
  },
  memoryType: {
    ring: "border-violet-400/50",
    bg: "bg-violet-500/10",
    text: "text-violet-200",
  },
  memory: {
    ring: "border-violet-300/30",
    bg: "bg-[var(--bg-elevated)]",
    text: "text-[var(--ink)]",
  },
  relationship: {
    ring: "border-rose-400/50",
    bg: "bg-rose-500/10",
    text: "text-rose-200",
  },
  bot: {
    ring: "border-emerald-400/50",
    bg: "bg-emerald-500/10",
    text: "text-emerald-200",
  },
  peer: {
    ring: "border-teal-400/40",
    bg: "bg-teal-500/10",
    text: "text-teal-100",
  },
  knowledge: {
    ring: "border-amber-400/50",
    bg: "bg-amber-500/10",
    text: "text-amber-100",
  },
};

function MindNode({ data, selected }: NodeProps<Node<MindNodeData>>) {
  const style = KIND_STYLE[data.kind] ?? KIND_STYLE.memory;
  const large = data.kind === "persona";

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 shadow-lg backdrop-blur-md transition",
        style.ring,
        style.bg,
        selected && "ring-2 ring-[var(--accent)]",
        large ? "min-w-[140px] px-4 py-3" : "min-w-[96px] max-w-[160px]",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-[var(--accent)]"
      />
      <p
        className={cn(
          "truncate text-[10px] uppercase tracking-[0.16em] opacity-70",
          style.text,
        )}
      >
        {data.kind}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate font-medium text-[var(--ink)]",
          large ? "text-base" : "text-sm",
        )}
      >
        {data.label}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-[var(--accent-2)]"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  mind: MindNode,
};

function layoutNodes(apiNodes: ApiNode[]): Node<MindNodeData>[] {
  const center = { x: 0, y: 0 };
  const rings: Record<GraphNodeKind, number> = {
    persona: 0,
    layer: 1,
    memoryType: 1,
    bot: 1,
    knowledge: 1,
    relationship: 2,
    memory: 2,
    peer: 2,
  };

  const byRing = new Map<number, ApiNode[]>();
  for (const n of apiNodes) {
    const r = rings[n.kind] ?? 2;
    const list = byRing.get(r) ?? [];
    list.push(n);
    byRing.set(r, list);
  }

  const result: Node<MindNodeData>[] = [];

  for (const n of apiNodes) {
    if (n.kind === "persona") {
      result.push({
        id: n.id,
        type: "mind",
        position: center,
        data: {
          kind: n.kind,
          label: n.label,
          detail: n.detail,
          meta: n.meta,
        },
      });
    }
  }

  for (const [ring, list] of byRing) {
    if (ring === 0) continue;
    const radius = ring === 1 ? 260 : 460;
    list.forEach((n, i) => {
      const angle = (i / Math.max(list.length, 1)) * Math.PI * 2 - Math.PI / 2;
      result.push({
        id: n.id,
        type: "mind",
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        },
        data: {
          kind: n.kind,
          label: n.label,
          detail: n.detail,
          meta: n.meta,
        },
      });
    });
  }

  return result;
}

type GraphPayload = {
  personaId: string;
  nodes: ApiNode[];
  edges: ApiEdge[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    memoryTotal: number;
    relationshipTotal: number;
  } | null;
  error: string | null;
};

export function PersonaMindGraph({ personaId }: { personaId: string }) {
  const [payload, setPayload] = useState<GraphPayload | null>(null);
  const [selected, setSelected] = useState<ApiNode | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/characters/${personaId}/graph`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load mind graph");
        if (cancelled) return;
        setPayload({
          personaId,
          nodes: data.nodes ?? [],
          edges: data.edges ?? [],
          stats: data.stats ?? null,
          error: null,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setPayload({
          personaId,
          nodes: [],
          edges: [],
          stats: null,
          error: e instanceof Error ? e.message : "Graph error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [personaId]);

  const ready = payload?.personaId === personaId ? payload : null;
  const loading = !ready;
  const error = ready?.error ?? null;
  const apiNodes = ready?.nodes;
  const apiEdges = ready?.edges;
  const stats = ready?.stats ?? null;

  const nodes = useMemo(
    () => layoutNodes(apiNodes ?? []),
    [apiNodes],
  );
  const edges: Edge[] = useMemo(
    () =>
      (apiEdges ?? []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.label === "remembers" || e.label === "channel",
        style: { stroke: "var(--accent)", strokeOpacity: 0.45 },
        labelStyle: { fill: "var(--muted)", fontSize: 10 },
      })),
    [apiEdges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const found = (apiNodes ?? []).find((n) => n.id === node.id) ?? null;
      setSelected(found);
    },
    [apiNodes],
  );

  const sparse =
    !loading &&
    !error &&
    (apiNodes ?? []).filter((n) => n.kind !== "persona" && n.kind !== "layer")
      .length === 0;

  if (loading) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/50">
        <p className="text-sm text-[var(--muted)]">Opening her mind…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--line)]">
        <p className="text-sm text-[var(--danger)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            Mind graph
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Identity layers, memories, relationships, and channels — pan and
            zoom like a knowledge map.
          </p>
        </div>
        {stats ? (
          <p className="text-xs text-[var(--muted)]">
            {stats.nodeCount} nodes · {stats.edgeCount} edges ·{" "}
            {stats.memoryTotal} memories · {stats.relationshipTotal}{" "}
            relationships
          </p>
        ) : null}
      </div>

      {sparse ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-elevated)]/40 px-6 py-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Her mind is still waking up
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Start a test chat or connect Telegram — memories and relationships
            will bloom into this graph.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href={`/chat?characterId=${personaId}`}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)]"
            >
              Test chat
            </Link>
            <Link
              href={`/personas/${personaId}/memory`}
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm"
            >
              Open memory
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="h-[560px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[#0a0e14]">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.25}
              maxZoom={1.6}
              proOptions={{ hideAttribution: true }}
              colorMode="dark"
            >
              <Background color="#1e293b" gap={22} size={1} />
              <Controls className="!bg-[var(--bg-elevated)] !border-[var(--line)] !shadow-none" />
              <MiniMap
                className="!bg-[var(--bg-elevated)] !border-[var(--line)]"
                maskColor="rgba(0,0,0,0.55)"
                nodeColor={() => "var(--accent)"}
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <aside className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/60 p-4">
          {selected ? (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {selected.kind}
              </p>
              <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                {selected.label}
              </h3>
              {selected.detail ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
                  {selected.detail}
                </p>
              ) : null}
              {selected.meta ? (
                <dl className="space-y-1 text-xs text-[var(--muted)]">
                  {Object.entries(selected.meta).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="capitalize">{k}</dt>
                      <dd className="text-[var(--ink)]">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {selected.kind === "memory" || selected.kind === "memoryType" ? (
                <Link
                  href={`/personas/${personaId}/memory`}
                  className="inline-block text-sm text-[var(--accent)] hover:underline"
                >
                  Open full memory →
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] flex-col justify-center text-sm text-[var(--muted)]">
              <p>Click a node to inspect it.</p>
              <ul className="mt-4 space-y-1.5 text-xs">
                <li>
                  <span className="text-sky-300">Layers</span> — Soul / Style /
                  Rules / Context
                </li>
                <li>
                  <span className="text-violet-300">Memory</span> — what she
                  recalls
                </li>
                <li>
                  <span className="text-rose-300">Relationships</span> — trust &
                  mood
                </li>
                <li>
                  <span className="text-emerald-300">Channels</span> — bots &
                  peers
                </li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
