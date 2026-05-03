"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function LearnVoiceForm() {
  const router = useRouter();
  const [handle, setHandle] = useState("pixii_ai");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: handle.replace(/^@/, "").trim(), platform: "twitter" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Voice learn failed");
      toast.success(`Learned @${handle}`);
      setHandle("");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6">
      <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Learn a new voice</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-muted-foreground">@</span>
        <Input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="pixii_ai"
          className="h-11"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Learn
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Pulls 40 recent posts via Ensemble Data, then Claude Sonnet writes the brief.</p>
    </form>
  );
}
