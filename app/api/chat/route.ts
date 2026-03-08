import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addChatMessageSupabase, listChatMessagesSupabase } from "@/server/persistence/supabase-chat";
import { addEventLogSupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

const postSchema = z.object({ userId: z.string().min(5), message: z.string().min(1) });

function buildAssistantReply(input: string) {
  const lower = input.toLowerCase();
  if (lower.includes("log injury") || lower.includes("injury")) {
    return {
      content: "I can convert this into a structured injury event. Review the extracted fields before saving.",
      extractionPreview: {
        type: "event_log",
        payload: { eventType: "injury", description: input }
      }
    };
  }
  if (lower.includes("sleep") || lower.includes("tinnitus") || lower.includes("back")) {
    return {
      content: "This may strengthen condition tracking. Consider adding a weekly check-in update and linking supporting evidence.",
      extractionPreview: {
        type: "condition_signal",
        payload: { text: input }
      }
    };
  }
  return {
    content: "I captured your note. I can help turn it into check-in entries, event logs, or claim strategy actions.",
    extractionPreview: { type: "note", payload: { text: input } }
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const messages = await listChatMessagesSupabase(auth.userId);
    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load conversation" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  try {
    const userMessage = await addChatMessageSupabase({
      userId,
      role: "user",
      content: body.message
    });

    const response = buildAssistantReply(body.message);
    const assistantMessage = await addChatMessageSupabase({
      userId,
      role: "assistant",
      content: response.content,
      extractionPreview: response.extractionPreview
    });

    if (response.extractionPreview.type === "event_log") {
      await addEventLogSupabase({
        userId,
        eventType: "injury",
        description: body.message,
        occurredAt: new Date().toISOString(),
        location: "",
        unit: ""
      });
    }

    return NextResponse.json({ ok: true, userMessage, assistantMessage });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to process chat message" },
      { status: 500 }
    );
  }
}
