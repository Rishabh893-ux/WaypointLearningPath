"use client";

import { useMemo } from "react";

type GraphItem = {
  courseId: string;
  title: string;
  domain: string;
  status: "planned" | "in_progress" | "completed" | "skipped";
  milestone: string;
  prerequisites: string[];
};

const COL_W = 210;
const ROW_H = 92;
const NODE_W = 170;
const NODE_H = 64;
const PAD = 24;

const STATUS_COLOR: Record<string, string> = {
  completed: "var(--accent)",
  in_progress: "var(--accent-2)",
  planned: "var(--border)",
  skipped: "var(--danger)",
};

export default function RoadmapGraph({
  items,
  onSelect,
}: {
  items: GraphItem[];
  onSelect: (courseId: string) => void;
}) {
  const layout = useMemo(() => computeLayout(items), [items]);

  const width = (layout.maxLevel + 1) * COL_W + PAD * 2;
  const height = layout.maxRows * ROW_H + PAD * 2;

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(width, 320)} height={Math.max(height, 200)} style={{ display: "block" }}>
        {layout.edges.map((e, i) => {
          const from = layout.positions[e.from];
          const to = layout.positions[e.to];
          if (!from || !to) return null;
          const x1 = from.x + NODE_W;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x;
          const y2 = to.y + NODE_H / 2;
          const midX = (x1 + x2) / 2;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              stroke="var(--border)"
              strokeWidth={1.5}
              fill="none"
              markerEnd="url(#arrow)"
            />
          );
        })}

        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--border)" />
          </marker>
        </defs>

        {items.map((item) => {
          const pos = layout.positions[item.courseId];
          if (!pos) return null;
          const color = STATUS_COLOR[item.status];
          return (
            <g
              key={item.courseId}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="cursor-pointer"
              onClick={() => onSelect(item.courseId)}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill="var(--panel)"
                stroke={color}
                strokeWidth={item.status === "planned" ? 1 : 1.75}
              />
              <circle cx={14} cy={14} r={4} fill={color} />
              <foreignObject x={10} y={22} width={NODE_W - 20} height={NODE_H - 26}>
                <div
                  style={{
                    fontSize: "11.5px",
                    lineHeight: 1.3,
                    color: "var(--text)",
                    fontFamily: "var(--font-body)",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                  title={item.title}
                >
                  {item.title}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-[var(--text-muted)]">
        {(["planned", "in_progress", "completed", "skipped"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: STATUS_COLOR[s], opacity: s === "planned" ? 0.5 : 1 }}
            />
            {s.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}

function computeLayout(items: GraphItem[]) {
  const idSet = new Set(items.map((i) => i.courseId));
  const level: Record<string, number> = {};

  function levelOf(id: string, seen: Set<string> = new Set()): number {
    if (level[id] !== undefined) return level[id];
    if (seen.has(id)) return 0; // guard against accidental cycles
    seen.add(id);
    const item = items.find((i) => i.courseId === id);
    if (!item) return 0;
    const prereqsInGraph = item.prerequisites.filter((p) => idSet.has(p));
    const lvl = prereqsInGraph.length === 0 ? 0 : 1 + Math.max(...prereqsInGraph.map((p) => levelOf(p, seen)));
    level[id] = lvl;
    return lvl;
  }

  for (const item of items) levelOf(item.courseId);

  const columns: Record<number, string[]> = {};
  for (const item of items) {
    const lvl = level[item.courseId];
    columns[lvl] ??= [];
    columns[lvl].push(item.courseId);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  let maxRows = 1;
  for (const [lvlStr, ids] of Object.entries(columns)) {
    const lvl = Number(lvlStr);
    maxRows = Math.max(maxRows, ids.length);
    ids.forEach((id, row) => {
      positions[id] = { x: PAD + lvl * COL_W, y: PAD + row * ROW_H };
    });
  }

  const edges: { from: string; to: string }[] = [];
  for (const item of items) {
    for (const p of item.prerequisites) {
      if (idSet.has(p)) edges.push({ from: p, to: item.courseId });
    }
  }

  const maxLevel = Math.max(0, ...Object.values(level));
  return { positions, edges, maxLevel, maxRows };
}
