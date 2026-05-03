import type { Niche, Platform, RawPost } from "./types";

const BASE = "https://ensembledata.com/apis";
const TOKEN = process.env.ENSEMBLE_DATA_TOKEN;

interface EnsembleResponse<T> {
  data: T;
  units_charged?: number;
}

async function ed<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  if (!TOKEN) throw new Error("ENSEMBLE_DATA_TOKEN missing");
  const url = new URL(BASE + path);
  url.searchParams.set("token", TOKEN);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ensemble ${path} ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as EnsembleResponse<T>;
  return json.data;
}

// ────────────────────────────── TikTok ──────────────────────────────

interface TTAwemeInfo {
  aweme_id?: string;
  desc?: string;
  create_time?: number;
  author?: { unique_id?: string; nickname?: string; sec_uid?: string };
  statistics?: {
    digg_count?: number;
    comment_count?: number;
    share_count?: number;
    play_count?: number;
  };
  share_url?: string;
}

interface TTSearchItem {
  type?: number;
  aweme_info?: TTAwemeInfo;
}

function ttItemToPost(item: TTSearchItem): RawPost | null {
  const a = item.aweme_info;
  if (!a || !a.aweme_id || !a.desc) return null;
  return {
    platform: "tiktok",
    source_id: a.aweme_id,
    url:
      a.share_url ??
      `https://www.tiktok.com/@${a.author?.unique_id ?? "user"}/video/${a.aweme_id}`,
    author_handle: a.author?.unique_id ?? "unknown",
    author_name: a.author?.nickname ?? null,
    content: a.desc,
    posted_at: a.create_time ? new Date(a.create_time * 1000).toISOString() : new Date().toISOString(),
    likes: a.statistics?.digg_count ?? 0,
    comments: a.statistics?.comment_count ?? 0,
    shares: a.statistics?.share_count ?? 0,
    views: a.statistics?.play_count ?? null,
    raw: a,
  };
}

export async function scrapeTikTokKeyword(keyword: string, period: "0" | "1" | "7" | "30" = "0", count = 50): Promise<RawPost[]> {
  // /tt/keyword/full-search returns: data: TTSearchItem[]
  try {
    const data = await ed<TTSearchItem[]>("/tt/keyword/full-search", { name: keyword, period });
    return (data ?? [])
      .map(ttItemToPost)
      .filter((p): p is RawPost => p !== null)
      .slice(0, count);
  } catch (e) {
    // Fall back to /tt/keyword/search → data: { data: TTSearchItem[] }
    try {
      const data = await ed<{ data?: TTSearchItem[] }>("/tt/keyword/search", { name: keyword, period, sorting: "1" });
      return (data?.data ?? [])
        .map(ttItemToPost)
        .filter((p): p is RawPost => p !== null)
        .slice(0, count);
    } catch (e2) {
      // eslint-disable-next-line no-console
      console.warn("[tt keyword]", (e2 as Error).message);
      return [];
    }
  }
}

// ────────────────────────────── Instagram ──────────────────────────────

interface IGNode {
  id?: string;
  shortcode?: string;
  edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> };
  owner?: { username?: string; full_name?: string };
  edge_liked_by?: { count?: number };
  edge_media_preview_like?: { count?: number };
  edge_media_to_comment?: { count?: number };
  video_view_count?: number;
  taken_at_timestamp?: number;
  __typename?: string;
}

interface IGHashtagResponse {
  data?: {
    name?: string;
    top_posts?: Array<{ node?: IGNode }>;
    edge_hashtag_to_media?: { edges?: Array<{ node?: IGNode }> };
  };
  // Newer shape:
  name?: string;
  top_posts?: Array<{ node?: IGNode }>;
  edge_hashtag_to_media?: { edges?: Array<{ node?: IGNode }> };
}

function igNodeToPost(n: IGNode | undefined): RawPost | null {
  if (!n || !(n.id || n.shortcode)) return null;
  const caption = n.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
  if (!caption) return null;
  return {
    platform: "instagram",
    source_id: n.id ?? n.shortcode!,
    url: `https://www.instagram.com/p/${n.shortcode ?? n.id}/`,
    author_handle: n.owner?.username ?? "unknown",
    author_name: n.owner?.full_name ?? null,
    content: caption,
    posted_at: n.taken_at_timestamp ? new Date(n.taken_at_timestamp * 1000).toISOString() : new Date().toISOString(),
    likes: n.edge_liked_by?.count ?? n.edge_media_preview_like?.count ?? 0,
    comments: n.edge_media_to_comment?.count ?? 0,
    shares: 0,
    views: n.video_view_count ?? null,
    raw: n,
  };
}

export async function scrapeInstagramHashtag(hashtag: string, count = 50): Promise<RawPost[]> {
  try {
    const root = await ed<IGHashtagResponse>("/instagram/hashtag/posts", { name: hashtag });
    const inner = root.data ?? root;
    const top = (inner.top_posts ?? []).map((e) => e.node);
    const recent = (inner.edge_hashtag_to_media?.edges ?? []).map((e) => e.node);
    return [...top, ...recent]
      .map(igNodeToPost)
      .filter((p): p is RawPost => p !== null)
      .slice(0, count);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[ig hashtag]", (e as Error).message);
    return [];
  }
}

// ────────────────────────────── YouTube ──────────────────────────────

interface YTRunText {
  text?: string;
}

interface YTVideoRenderer {
  videoId?: string;
  title?: { runs?: YTRunText[]; simpleText?: string };
  longBylineText?: { runs?: Array<{ text?: string; navigationEndpoint?: { browseEndpoint?: { canonicalBaseUrl?: string } } }> };
  ownerText?: { runs?: Array<{ text?: string }> };
  detailedMetadataSnippets?: Array<{ snippetText?: { runs?: YTRunText[] } }>;
  viewCountText?: { simpleText?: string };
  publishedTimeText?: { simpleText?: string };
}

interface YTPostItem {
  videoRenderer?: YTVideoRenderer;
}

function ytParseViews(s?: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : null;
}

function ytItemToPost(item: YTPostItem): RawPost | null {
  const v = item.videoRenderer;
  if (!v?.videoId) return null;
  const title = v.title?.runs?.[0]?.text ?? v.title?.simpleText ?? "";
  const desc = v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r) => r.text ?? "").join(" ") ?? "";
  const content = [title, desc].filter(Boolean).join(" — ");
  if (!content) return null;
  const channel = v.longBylineText?.runs?.[0]?.text ?? v.ownerText?.runs?.[0]?.text ?? "unknown";
  const channelUrl = v.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ?? "";
  const handle = channelUrl.replace(/^\/?@?/, "") || channel.replace(/\s+/g, "").toLowerCase();
  return {
    platform: "youtube",
    source_id: v.videoId,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    author_handle: handle || "unknown",
    author_name: channel,
    content,
    posted_at: new Date().toISOString(),
    likes: 0,
    comments: 0,
    shares: 0,
    views: ytParseViews(v.viewCountText?.simpleText),
    raw: v,
  };
}

export async function scrapeYouTubeKeyword(keyword: string, count = 30): Promise<RawPost[]> {
  try {
    const data = await ed<{ posts?: YTPostItem[] }>("/youtube/search", { keyword, depth: "1", get_subtitles: "false" });
    return (data?.posts ?? [])
      .map(ytItemToPost)
      .filter((p): p is RawPost => p !== null)
      .slice(0, count);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[yt keyword]", (e as Error).message);
    return [];
  }
}

// ────────────────────────────── Twitter ──────────────────────────────
//
// Ensemble's Twitter API works in two steps:
//   1) /twitter/user/info?name=<handle>   → returns user object whose `id` is base64("User:<rest_id>")
//   2) /twitter/user/tweets?id=<rest_id>  → returns timeline entries
//
// The timeline payload is the raw Twitter GraphQL shape — TimelineTweet entries that wrap
// `itemContent.tweet_results.result.legacy`, with quoted/retweeted variants nested deeper.

interface TwUserInfoResp {
  id?: string;
  legacy?: {
    screen_name?: string;
    name?: string;
    followers_count?: number;
    statuses_count?: number;
  };
}

interface TwTweetEntry {
  content?: {
    itemContent?: {
      tweet_results?: {
        result?: {
          rest_id?: string;
          legacy?: {
            full_text?: string;
            favorite_count?: number;
            reply_count?: number;
            retweet_count?: number;
            created_at?: string;
          };
          views?: { count?: string | number };
          core?: { user_results?: { result?: { legacy?: { screen_name?: string; name?: string } } } };
        };
      };
    };
  };
}

function decodeRestId(encoded: string): string | null {
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const m = decoded.match(/User:(\d+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export interface TwitterUserSnapshot {
  handle: string;
  display_name: string | null;
  followers: number;
  statuses: number;
  tweets: RawPost[];
}

export async function scrapeTwitterUser(username: string, count = 50): Promise<RawPost[]> {
  const snap = await scrapeTwitterUserDetailed(username, count);
  return snap?.tweets ?? [];
}

export async function scrapeTwitterUserDetailed(username: string, count = 50): Promise<TwitterUserSnapshot | null> {
  const handle = username.replace(/^@/, "");
  let info: TwUserInfoResp;
  try {
    info = await ed<TwUserInfoResp>("/twitter/user/info", { name: handle });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[tw user/info @${handle}]`, (e as Error).message);
    return null;
  }
  if (!info.id) return null;
  const restId = decodeRestId(info.id);
  if (!restId) return null;

  let entries: TwTweetEntry[] = [];
  try {
    entries = await ed<TwTweetEntry[]>("/twitter/user/tweets", { id: restId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[tw user/tweets @${handle}]`, (e as Error).message);
    return {
      handle,
      display_name: info.legacy?.name ?? null,
      followers: info.legacy?.followers_count ?? 0,
      statuses: info.legacy?.statuses_count ?? 0,
      tweets: [],
    };
  }

  const tweets: RawPost[] = [];
  for (const entry of entries ?? []) {
    const t = entry.content?.itemContent?.tweet_results?.result;
    if (!t || !t.rest_id || !t.legacy?.full_text) continue;
    const userLegacy = t.core?.user_results?.result?.legacy ?? {};
    const screenName = userLegacy.screen_name ?? handle;
    const v = t.views?.count;
    const views = typeof v === "string" ? parseInt(v, 10) : (v as number | undefined) ?? null;
    tweets.push({
      platform: "twitter",
      source_id: t.rest_id,
      url: `https://x.com/${screenName}/status/${t.rest_id}`,
      author_handle: screenName,
      author_name: userLegacy.name ?? null,
      content: t.legacy.full_text,
      posted_at: t.legacy.created_at ? new Date(t.legacy.created_at).toISOString() : new Date().toISOString(),
      likes: t.legacy.favorite_count ?? 0,
      comments: t.legacy.reply_count ?? 0,
      shares: t.legacy.retweet_count ?? 0,
      views,
      raw: t,
    });
    if (tweets.length >= count) break;
  }

  return {
    handle,
    display_name: info.legacy?.name ?? null,
    followers: info.legacy?.followers_count ?? 0,
    statuses: info.legacy?.statuses_count ?? 0,
    tweets,
  };
}

// ────────────────────────────── Niche orchestration ──────────────────────────────

export async function scrapeNiche(niche: Niche, opts?: { perSourceLimit?: number }): Promise<RawPost[]> {
  const limit = opts?.perSourceLimit ?? 30;
  const keywords = NICHE_KEYWORDS[niche] ?? NICHE_KEYWORDS.general;
  const buckets: RawPost[][] = [];
  for (const kw of keywords.slice(0, 3)) {
    buckets.push(await scrapeTikTokKeyword(kw, "0", limit).catch(() => []));
    buckets.push(await scrapeYouTubeKeyword(kw, Math.floor(limit / 2)).catch(() => []));
  }
  for (const tag of (NICHE_HASHTAGS[niche] ?? NICHE_HASHTAGS.general).slice(0, 2)) {
    buckets.push(await scrapeInstagramHashtag(tag, limit).catch(() => []));
  }
  return buckets.flat().map((p) => ({ ...p, niche }));
}

export const NICHE_KEYWORDS: Record<Niche, string[]> = {
  "amazon-seller": ["amazon seller tips", "amazon listing optimization", "amazon FBA"],
  ecommerce: ["ecommerce tips", "shopify hacks", "DTC marketing"],
  "ai-tools": ["AI tools founder", "AI agents startup", "ai workflow"],
  dtc: ["DTC brand growth", "shopify brand"],
  "creator-economy": ["creator economy", "personal brand"],
  saas: ["SaaS founder", "B2B saas growth"],
  general: ["startup tips", "marketing hooks"],
};

export const NICHE_HASHTAGS: Record<Niche, string[]> = {
  "amazon-seller": ["amazonseller", "amazonfba"],
  ecommerce: ["ecommerce", "shopify"],
  "ai-tools": ["aiagents", "buildinpublic"],
  dtc: ["dtcbrand"],
  "creator-economy": ["creatoreconomy", "personalbrand"],
  saas: ["saasfounder"],
  general: ["marketing"],
};
