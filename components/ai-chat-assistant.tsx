"use client";

import { useState, useEffect, useRef } from "react";

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) fetchMessages();
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    const res = await fetch("/api/ai-chat");
    if (res.ok) setMessages(await res.json());
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    
    const res = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input }),
    });
    
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => [...prev, data.userMessage, data.assistantMessage]);
      setInput("");
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform"
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] rounded-xl border bg-card shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">🤖 AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-sm text-muted-foreground">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Hallo! Ich bin dein Venture Studio Assistant. Wie kann ich dir helfen?
              </div>
            )}
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">⏳ Denke nach...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          
          <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Frage stellen..."
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
            <button type="submit" disabled={loading} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
