import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie, isProtectedPath } from "@/server/guards/route-protection";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = isProtectedPath(pathname);
  const hasSession = hasSessionCookie({
    "sb-access-token": request.cookies.get("sb-access-token")?.value,
    "sb:token": request.cookies.get("sb:token")?.value
  });

  if (requiresAuth && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
