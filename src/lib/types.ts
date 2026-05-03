export type Platform = "tiktok" | "instagram" | "youtube" | "twitter" | "linkedin" | "reddit";

export type Niche =
  | "amazon-seller"
  | "ecommerce"
  | "ai-tools"
  | "dtc"
  | "creator-economy"
  | "saas"
  | "general";

export interface RawPost {
  platform: Platform;
  source_id: string;
  url: string;
  author_handle: string;
  author_name?: string | null;
  content: string;
  posted_at: string;
  likes: number;
  comments: number;
  shares: number;
  views?: number | null;
  niche?: Niche;
  raw?: unknown;
}

export interface ClassifiedPost extends RawPost {
  hook: string;
  pattern_id: string;
  pattern_confidence: number;
  niche: Niche;
  hook_embedding?: number[];
}

export interface HookPattern {
  id: string;
  name: string;
  description: string;
  examples: string[];
  emoji: string;
}

export interface BrandVoice {
  id: string;
  handle: string;
  platform: Platform;
  voice_summary: string;
  preferred_patterns: string[];
  vocab_signals: string[];
  sample_posts: string[];
  created_at: string;
}

export interface GeneratedPost {
  id: string;
  brand_voice_id: string;
  pattern_id: string;
  hook: string;
  body: string;
  cta: string;
  product_context: string;
  rationale: string;
  created_at: string;
}

export interface PatternVelocity {
  pattern_id: string;
  recent_count: number;
  baseline_count: number;
  velocity: number;
  trend: "rising" | "steady" | "falling";
  avg_engagement: number;
}
