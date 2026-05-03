import { ApifyClient } from "apify-client";
import type { Platform, RawPost } from "./types";

const TOKEN = process.env.APIFY_TOKEN;

let _client: ApifyClient | null = null;
function client(): ApifyClient {
  if (!TOKEN) throw new Error("APIFY_TOKEN missing");
  if (!_client) _client = new ApifyClient({ token: TOKEN });
  return _client;
}

interface RedditItem {
  id?: string;
  url?: string;
  title?: string;
  body?: string;
  author?: string;
  numberOfUpvotes?: number;
  numberOfComments?: number;
  createdAt?: string;
  parsedCommunityName?: string;
  communityName?: string;
}

export async function scrapeReddit(subreddits: string[], count = 50): Promise<RawPost[]> {
  if (subreddits.length === 0) return [];
  try {
    const run = await client().actor("trudax/reddit-scraper-lite").call({
      startUrls: subreddits.map((s) => ({ url: `https://www.reddit.com/r/${s}/top/?t=week` })),
      maxItems: count,
      maxComments: 0,
      maxCommunitiesAndUsers: 0,
      proxy: { useApifyProxy: true },
    });
    const { items } = await client().dataset(run.defaultDatasetId).listItems();
    return (items as RedditItem[])
      .filter((i) => i.id && (i.title || i.body))
      .map((i) => ({
        platform: "reddit" as Platform,
        source_id: i.id ?? "",
        url: i.url ?? "",
        author_handle: i.author ?? "unknown",
        author_name: null,
        content: [i.title, i.body].filter(Boolean).join(" — "),
        posted_at: i.createdAt ?? new Date().toISOString(),
        likes: i.numberOfUpvotes ?? 0,
        comments: i.numberOfComments ?? 0,
        shares: 0,
        views: null,
        raw: i,
      }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[apify reddit]", (e as Error).message);
    return [];
  }
}

interface LinkedInItem {
  urn?: string;
  url?: string;
  text?: string;
  authorName?: string;
  authorPublicId?: string;
  numLikes?: number;
  numComments?: number;
  numShares?: number;
  postedDate?: string;
}

// LinkedIn scrapers on Apify churn through naming. Try a small list — first one that works
// returns. If all fail, return [] silently. LinkedIn is a bonus source, not load-bearing.
const LINKEDIN_ACTORS = [
  "curious_coder/linkedin-post-search-scraper",
  "harvestapi/linkedin-post-search",
  "logical_scrapers/linkedin-post-search",
];

export async function scrapeLinkedIn(searchQueries: string[], count = 30): Promise<RawPost[]> {
  if (searchQueries.length === 0) return [];
  for (const actorId of LINKEDIN_ACTORS) {
    try {
      const run = await client()
        .actor(actorId)
        .call(
          { queries: searchQueries, maxItems: count, contentType: "post", searchType: "post" },
          { waitSecs: 60 },
        );
      const { items } = await client().dataset(run.defaultDatasetId).listItems();
      const mapped = (items as LinkedInItem[])
        .filter((i) => i.text)
        .map((i) => ({
          platform: "linkedin" as Platform,
          source_id: i.urn ?? i.url ?? "",
          url: i.url ?? "",
          author_handle: i.authorPublicId ?? "unknown",
          author_name: i.authorName ?? null,
          content: i.text ?? "",
          posted_at: i.postedDate ?? new Date().toISOString(),
          likes: i.numLikes ?? 0,
          comments: i.numComments ?? 0,
          shares: i.numShares ?? 0,
          views: null,
          raw: i,
        }));
      if (mapped.length > 0) return mapped;
    } catch {
      // try next actor
    }
  }
  // eslint-disable-next-line no-console
  console.warn("[apify linkedin] no working actor — skipping LinkedIn");
  return [];
}
