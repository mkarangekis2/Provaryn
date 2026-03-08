import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "valor-claims-os", timestamp: new Date().toISOString() });
}
