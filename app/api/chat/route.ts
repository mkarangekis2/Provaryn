import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addChatMessage, addEventLog, listChatMessages } from "@/server/mock/store";
import { addChatMessageSupabase, listChatMessagesSupabase } from "@/server/persistence/supabase-chat";
import { addEventLogSupabase } from "@/server/persistence/supabase-intake";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

const getSchema = z.object({ userId: z.string().min(5) });
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
  } catch {
    return NextResponse.json({ ok: true, messages: listChatMessages(auth.userId) });
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  let userMessage: ReturnType<typeof addChatMessage>;
  try {
    userMessage = await addChatMessageSupabase({
      userId,
      role: "user",
      content: body.message
    });
  } catch {
    userMessage = addChatMessage(userId, {
      id: randomUUID(),
      role: "user",
      content: body.message,
      createdAt: new Date().toISOString()
    });
  }

  const response = buildAssistantReply(body.message);
  let assistantMessage: ReturnType<typeof addChatMessage>;
  try {
    assistantMessage = await addChatMessageSupabase({
      userId,
      role: "assistant",
      content: response.content,
      extractionPreview: response.extractionPreview
    });
  } catch {
    assistantMessage = addChatMessage(userId, {
      id: randomUUID(),
      role: "assistant",
      content: response.content,
      extractionPreview: response.extractionPreview,
      createdAt: new Date().toISOString()
    });
  }

  if (response.extractionPreview.type === "event_log") {
    try {
      await addEventLogSupabase({
        userId,
        eventType: "injury",
        description: body.message,
        occurredAt: new Date().toISOString(),
        location: "",
        unit: ""
      });
    } catch {
      addEventLog({
        userId,
        eventType: "injury",
        description: body.message,
        occurredAt: new Date().toISOString(),
        location: "",
        unit: ""
      });
    }
  }

  return NextResponse.json({ ok: true, userMessage, assistantMessage });
}
