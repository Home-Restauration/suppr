import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => { try { cookieStore.set({ name, value, ...options }); } catch {} },
        remove: (name, options) => { try { cookieStore.set({ name, value: "", ...options }); } catch {} },
      },
    }
  );
}
