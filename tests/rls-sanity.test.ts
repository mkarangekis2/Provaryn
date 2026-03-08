import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("RLS sanity", () => {
  it("migration enables RLS and declares policies", () => {
    const sql = readFileSync("db/migrations/0001_init_schema.sql", "utf-8");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("create policy");
  });
});
