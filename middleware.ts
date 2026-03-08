import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { isProtectedPath } from "@/server/guards/route-protection";

function readAalFromAccessToken(accessToken?: string | null) {
  if (!accessToken) return null;
  const segments = accessToken.split(".");
  if (segments.length < 2) return null;
  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    const json = JSON.parse(decoded) as { aal?: string };
    return json.aal ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = isProtectedPath(pathname);
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (requiresAuth && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (requiresAuth && session) {
    const aal = readAalFromAccessToken(session.access_token);
    if (aal !== "aal2") {
      const url = request.nextUrl.clone();
      url.pathname = "/mfa-setup";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
