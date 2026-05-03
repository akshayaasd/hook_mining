import "./_env";
import { ingestNiche } from "@/lib/ingest";
import type { Niche } from "@/lib/types";

const NICHES: Niche[] = ["amazon-seller", "ecommerce", "ai-tools"];

async function main() {
  const arg = process.argv[2] as Niche | undefined;
  const niches = arg ? [arg] : NICHES;
  for (const n of niches) {
    console.log(`→ ingesting niche: ${n}`);
    const r = await ingestNiche(n, { perSource: 30 });
    console.log(`  scraped=${r.scraped} classified=${r.classified} inserted=${r.inserted} embedded=${r.embedded}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
