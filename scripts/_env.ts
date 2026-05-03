import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Next.js convention: .env.local overrides .env
for (const f of [".env.local", ".env"]) {
  const p = resolve(process.cwd(), f);
  if (existsSync(p)) config({ path: p, override: false });
}
