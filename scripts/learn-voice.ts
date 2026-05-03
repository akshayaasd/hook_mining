import "./_env";
import { learnBrandVoice } from "@/lib/voice";

async function main() {
  const handle = process.argv[2];
  if (!handle) {
    console.error("usage: tsx scripts/learn-voice.ts <handle>");
    process.exit(1);
  }
  console.log(`→ learning voice for @${handle}`);
  const v = await learnBrandVoice(handle);
  console.log(`✔ ${v.id}`);
  console.log(v.voice_summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
