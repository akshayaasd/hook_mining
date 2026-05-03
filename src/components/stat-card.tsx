import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="number-display mt-2 text-4xl text-foreground">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {delta && <span className="font-medium text-emerald-600">{delta}</span>}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  );
}
