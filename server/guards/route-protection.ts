const protectedPrefixes = ["/home", "/check-in", "/events", "/chat", "/vault", "/conditions", "/claim-intelligence", "/claim-strategy", "/rating-estimator", "/transition", "/claim-builder", "/benefits", "/appeals", "/coach", "/admin", "/settings", "/onboarding", "/claim-status"];

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}
