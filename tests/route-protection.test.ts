import { describe, expect, it } from "vitest";
import { hasSessionCookie, isProtectedPath } from "@/server/guards/route-protection";

describe("route protection", () => {
  it("flags protected paths", () => {
    expect(isProtectedPath("/home")).toBe(true);
    expect(isProtectedPath("/pricing")).toBe(false);
  });

  it("reads session cookies", () => {
    expect(hasSessionCookie({ "sb-access-token": "x" })).toBe(true);
    expect(hasSessionCookie({})).toBe(false);
  });
});
