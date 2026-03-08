import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json({ received: true, note: "Stripe webhook scaffold. Verify signatures before processing in production." });
}
