"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  extractionPreview?: { type: string; payload: Record<string, unknown> };
};

export function ChatAssistantPanel() {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("Document back pain after field exercise and missed duty.");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const res = await fetch(`/api/chat?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { messages: Message[] };
    setMessages(payload.messages);
  }

  async function send() {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message: input })
    });
    if (!res.ok) return;
    setInput("");
    await load(userId);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">AI Chat Assistant</h1></Card>
      <Card className="p-6">
        <div className="space-y-3 max-h-[420px] overflow-auto">
          {messages.map((m) => (
            <div key={m.id} className={`rounded-xl px-4 py-3 ${m.role === "user" ? "bg-panel2" : "border border-border bg-panel2/40"}`}>
              <p className="text-xs text-muted uppercase">{m.role}</p>
              <p className="text-sm mt-1">{m.content}</p>
              {m.extractionPreview ? <pre className="mt-2 text-xs text-muted whitespace-pre-wrap">Preview: {JSON.stringify(m.extractionPreview, null, 2)}</pre> : null}
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4 flex gap-2">
        <input className="flex-1 rounded-xl bg-panel2 border border-border px-3 py-2" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask or log an incident..." />
        <Button onClick={send}>Send</Button>
      </Card>
    </div>
  );
}
