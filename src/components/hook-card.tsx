import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PATTERN_BY_ID } from "@/lib/patterns";
import { formatCount } from "@/lib/utils";
import { ExternalLink, Heart, MessageCircle, Repeat2 } from "lucide-react";

export interface HookCardData {
  id: string;
  hook: string;
  pattern_id: string | null;
  niche?: string | null;
  platform: string;
  author_handle: string;
  url: string;
  likes: number;
  comments: number;
  shares: number;
  views?: number | null;
  engagement?: number | null;
  posted_at: string;
}

const platformLabel: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "IG",
  youtube: "YouTube",
  twitter: "X",
  linkedin: "LinkedIn",
  reddit: "Reddit",
};

export function HookCard({ post }: { post: HookCardData }) {
  const pattern = post.pattern_id ? PATTERN_BY_ID[post.pattern_id] : null;
  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/30">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="font-mono uppercase">{platformLabel[post.platform] ?? post.platform}</Badge>
        {pattern && (
          <Badge variant="accent">
            <span>{pattern.emoji}</span>
            <span>{pattern.name}</span>
          </Badge>
        )}
        {post.niche && <span className="text-[11px] uppercase tracking-wider">{post.niche}</span>}
      </div>
      <p className="font-display text-2xl leading-tight text-foreground">
        “{post.hook}”
      </p>
      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">@{post.author_handle}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {formatCount(post.likes)}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> {formatCount(post.comments)}</span>
          <span className="inline-flex items-center gap-1"><Repeat2 className="size-3.5" /> {formatCount(post.shares)}</span>
        </div>
      </div>
      <Link href={post.url} target="_blank" rel="noreferrer" className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground">
        <ExternalLink className="size-4" />
        <span className="sr-only">Open source</span>
      </Link>
    </article>
  );
}
