import "./_env";
import { getServerClient } from "@/lib/supabase";
import { embedHooks } from "@/lib/embed";

async function main() {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("posts")
    .select("id, hook")
    .is("hook_embedding", null)
    .not("hook", "is", null)
    .limit(500);
  if (error) throw error;
  if (!data || data.length === 0) {
    console.log("nothing to embed");
    return;
  }
  console.log(`→ embedding ${data.length}`);
  await embedHooks(data.map((d) => ({ id: d.id as string, hook: d.hook as string })));
  console.log("✔ done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
