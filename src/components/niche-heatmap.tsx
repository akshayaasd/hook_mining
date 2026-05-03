import { HOOK_PATTERNS, NICHES } from "@/lib/patterns";
import { cn } from "@/lib/utils";

export interface HeatCell {
  niche: string;
  pattern_id: string;
  count: number;
  avg_engagement: number;
}

export function NicheHeatmap({ cells }: { cells: HeatCell[] }) {
  const lookup: Record<string, HeatCell> = {};
  let max = 1;
  for (const c of cells) {
    lookup[`${c.niche}::${c.pattern_id}`] = c;
    if (c.count > max) max = c.count;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-card pr-2 text-left font-medium text-muted-foreground">Pattern</th>
            {NICHES.map((n) => (
              <th key={n.id} className="px-1 py-2 text-center font-medium text-muted-foreground">
                {n.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOOK_PATTERNS.map((p) => (
            <tr key={p.id}>
              <td className="sticky left-0 z-10 bg-card pr-2 text-left font-medium text-foreground">
                <span className="mr-1.5">{p.emoji}</span>
                {p.name}
              </td>
              {NICHES.map((n) => {
                const cell = lookup[`${n.id}::${p.id}`];
                const intensity = cell ? cell.count / max : 0;
                return (
                  <td key={n.id} className="p-0">
                    <div
                      className={cn("h-9 rounded-md text-center text-[11px] leading-9 transition-colors")}
                      style={{
                        background: intensity
                          ? `hsl(24 95% ${85 - Math.round(intensity * 35)}%)`
                          : "hsl(var(--secondary))",
                        color: intensity > 0.5 ? "white" : "hsl(var(--muted-foreground))",
                      }}
                      title={cell ? `${cell.count} posts · avg engagement ${Math.round(cell.avg_engagement)}` : "—"}
                    >
                      {cell ? cell.count : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
