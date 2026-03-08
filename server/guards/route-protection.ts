const protectedPrefixes = ["/home", "/action-queue", "/check-in", "/events", "/chat", "/defects", "/vault", "/conditions", "/claim-intelligence", "/claim-strategy", "/rating-estimator", "/transition", "/claim-builder", "/benefits", "/appeals", "/coach", "/admin", "/settings", "/onboarding", "/claim-status"];

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function hasSessionCookie(cookies: Record<string, string | undefined>) {
  return Boolean(cookies["sb-access-token"] || cookies["sb:token"]);
}
