import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getServerClient(): SupabaseClient {
  if (!url || !service) throw new Error("Supabase server env missing");
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getBrowserClient(): SupabaseClient {
  if (!url || !anon) throw new Error("Supabase browser env missing");
  return createClient(url, anon);
}
