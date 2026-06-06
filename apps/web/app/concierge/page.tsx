"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "bot";

interface BaseMessage {
  id: string;
  role: MessageRole;
  content: string;
  ts: number;
}

interface PaymentCard {
  type: "payment";
  event_title: string;
  event_date: string;
  total_cents: number;
  checkout_url: string;
}

interface AddressCard {
  type: "address";
  address: string;
  maps_url: string;
}

interface TextMessage extends BaseMessage {
  card?: undefined;
}

interface CardMessage extends BaseMessage {
  card: PaymentCard | AddressCard;
}

type Message = TextMessage | CardMessage;

const STORAGE_KEY = "suppr-concierge-history";
const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL ?? "";

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
  } catch {}
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Message bubbles ────────────────────────────────────────────────────────────

function BotAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-accent-tint)", border: "0.5px solid var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, color: "var(--color-accent-deep)" }}>S</span>
    </div>
  );
}

function PaymentBubble({ card }: { card: PaymentCard }) {
  return (
    <div style={{ background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: "14px 16px", width: 260 }}>
      <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Payment link</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 2 }}>{card.event_title}</p>
      <p style={{ fontSize: 12, color: "var(--color-text-2)", marginBottom: 12 }}>{card.event_date}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>{fmtCents(card.total_cents)}</p>
        <a href={card.checkout_url} style={{ display: "inline-flex", alignItems: "center", height: 34, padding: "0 16px", background: "var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "white", textDecoration: "none" }}>
          Pay now
        </a>
      </div>
    </div>
  );
}

function AddressBubble({ card }: { card: AddressCard }) {
  return (
    <div style={{ background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: "14px 16px", width: 260 }}>
      <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>Event address</p>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" stroke="var(--color-accent)" strokeWidth="1.2" />
          <circle cx="8" cy="6" r="1.5" stroke="var(--color-accent)" strokeWidth="1.2" />
        </svg>
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)", lineHeight: 1.4 }}>{card.address}</p>
      </div>
      <a href={card.maps_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--color-trust)", fontWeight: 500, textDecoration: "none" }}>
        Add to Maps →
      </a>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: isUser ? "row-reverse" : "row", marginBottom: 12 }}>
      {!isUser && <BotAvatar />}

      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 4 }}>
        {msg.card ? (
          msg.card.type === "payment" ? <PaymentBubble card={msg.card} /> : <AddressBubble card={msg.card} />
        ) : (
          <div style={{
            padding: "10px 14px",
            background: isUser ? "var(--color-accent-tint)" : "var(--color-surface-2)",
            borderRadius: isUser ? "var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)" : "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)",
            fontSize: 14, color: "var(--color-text)", lineHeight: 1.5,
          }}>
            {msg.content}
          </div>
        )}
        <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{fmtTime(msg.ts)}</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
      <BotAvatar />
      <div style={{ padding: "10px 16px", background: "var(--color-surface-2)", borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center", height: 16 }}>
          {[0, 150, 300].map(delay => (
            <span key={delay} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-muted)", animation: `suppr-pulse 1.2s ${delay}ms ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ConciergePage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    return loadHistory();
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "bot",
        content: "Hi! I'm your Suppr concierge. I can help you find a dinner, book seats, answer questions about your reservation, or connect you with your chef. What can I help you with?",
        ts: Date.now(),
      }]);
    }
  }, []);

  useEffect(() => {
    saveHistory(messages);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch(`${BOT_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), session_id: sessionId }),
      });

      if (!res.ok) throw new Error("bot error");

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream")) {
        // SSE streaming
        const reader = res.body?.getReader();
        if (!reader) throw new Error("no reader");
        const decoder = new TextDecoder();
        const botId = `b-${Date.now()}`;
        let accumulated = "";

        setMessages(prev => [...prev, { id: botId, role: "bot", content: "", ts: Date.now() }]);
        setTyping(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.delta) {
                  accumulated += data.delta;
                  setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: accumulated } : m));
                }
                if (data.card) {
                  setMessages(prev => prev.map(m => m.id === botId ? { ...m, card: data.card } : m));
                }
              } catch {}
            }
          }
        }
      } else {
        // Non-streaming JSON response
        const data = await res.json();
        setTyping(false);
        const botMsg: Message = {
          id: `b-${Date.now()}`,
          role: "bot",
          content: data.message ?? "",
          ts: Date.now(),
          ...(data.card ? { card: data.card } : {}),
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch {
      setTyping(false);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "bot",
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        ts: Date.now(),
      }]);
    }
  }, [sessionId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleStartOver() {
    if (!confirm("Clear conversation history?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setMessages([{
      id: "welcome-new",
      role: "bot",
      content: "Fresh start! How can I help you?",
      ts: Date.now(),
    }]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--color-canvas)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "0.5px solid var(--color-hairline)", background: "var(--color-surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BotAvatar />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>Suppr Concierge</p>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Always here to help</p>
          </div>
        </div>
        <button onClick={handleStartOver} style={{ height: 30, padding: "0 12px", background: "transparent", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 12, color: "var(--color-text-muted)", cursor: "pointer" }}>
          Start over
        </button>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
        background: "var(--color-surface)", borderTop: "0.5px solid var(--color-hairline)",
        display: "flex", gap: 10, alignItems: "center", flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about tonight's dinners…"
          style={{
            flex: 1, height: 44, padding: "0 16px",
            background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
            borderRadius: 22, fontSize: 14, color: "var(--color-text)",
            fontFamily: "var(--font-sans)", outline: "none",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || typing}
          style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: input.trim() && !typing ? "var(--color-text)" : "var(--color-surface-2)",
            border: "none", cursor: input.trim() && !typing ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 8H2.5M13.5 8l-4-4M13.5 8l-4 4" stroke={input.trim() && !typing ? "var(--color-canvas)" : "var(--color-text-muted)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
