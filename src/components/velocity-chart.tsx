"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PatternVelocity } from "@/lib/types";
import { PATTERN_BY_ID } from "@/lib/patterns";

interface Row {
  pattern_id: string;
  velocity: number;
  trend: PatternVelocity["trend"];
  recent_count: number;
  name: string;
  emoji: string;
}

export function VelocityChart({ data }: { data: PatternVelocity[] }) {
  const rows: Row[] = data
    .map((d) => {
      const p = PATTERN_BY_ID[d.pattern_id];
      return {
        pattern_id: d.pattern_id,
        velocity: Number(((d.velocity - 1) * 100).toFixed(0)),
        trend: d.trend,
        recent_count: d.recent_count,
        name: p?.name ?? d.pattern_id,
        emoji: p?.emoji ?? "•",
      };
    })
    .filter((r) => r.recent_count > 0)
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, 12);

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(v: string, i?: number) => {
              const r = rows[i ?? 0];
              return r ? `${r.emoji}  ${r.name}` : v;
            }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--secondary))" }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v: number, _n, p) => [`${v > 0 ? "+" : ""}${v}% vs 30d baseline`, (p?.payload as Row).name]}
            labelFormatter={() => ""}
          />
          <Bar dataKey="velocity" radius={[0, 6, 6, 0]}>
            {rows.map((r, i) => (
              <Cell
                key={i}
                fill={r.velocity > 0 ? "hsl(var(--accent))" : r.velocity < 0 ? "hsl(220 14% 80%)" : "hsl(220 14% 70%)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
