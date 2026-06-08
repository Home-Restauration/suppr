import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Until Supabase CLI generates typed DB types, we use a permissive any-schema.
// Replace with: import type { Database } from '../../../supabase/types.ts' when generated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DB = any;

let _service: SupabaseClient<DB> | null = null;

/** Service-role client — use only in trusted server contexts (route handlers, workers). */
export function createServiceClient(): SupabaseClient<DB> {
  return (_service ??= createClient<DB>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  ));
}

/** Anon client for public, RLS-enforced queries. */
export function createAnonClient(): SupabaseClient<DB> {
  return createClient<DB>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Return a client authenticated as the calling user (via their JWT). */
export function createUserClient(token: string): SupabaseClient<DB> {
  return createClient<DB>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}
