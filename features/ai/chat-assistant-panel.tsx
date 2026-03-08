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
  const [status, setStatus] = useState("");
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setInterval(() => {
      setCooldownSec((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec]);

  async function load(id: string) {
    const res = await fetch(`/api/chat?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { messages: Message[] };
    setMessages(payload.messages);
  }

  async function send() {
    if (cooldownSec > 0) return;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message: input })
    });
    if (!res.ok) {
      if (res.status === 429) {
        const payload = (await res.json()) as { retryAfterSec?: number; error?: string };
        const retryAfter = payload.retryAfterSec ?? 30;
        setCooldownSec(retryAfter);
        setStatus(payload.error ?? "Rate limit exceeded. Please wait before retrying.");
        return;
      }
      setStatus("Unable to send message right now.");
      return;
    }
    setInput("");
    setStatus("");
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
        <Button onClick={send} disabled={cooldownSec > 0}>{cooldownSec > 0 ? `Retry in ${cooldownSec}s` : "Send"}</Button>
      </Card>
      {status ? <p className="text-sm text-warning">{status}</p> : null}
    </div>
  );
}
