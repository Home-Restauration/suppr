import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => request.cookies.get(n)?.value,
        set: (n: string, v: string, opts: CookieOptions) => { response.cookies.set({ name: n, value: v, ...opts }); },
        remove: (n: string, opts: CookieOptions) => { response.cookies.set({ name: n, value: "", ...opts }); },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/chef-console/:path*", "/admin-console/:path*"],
};
