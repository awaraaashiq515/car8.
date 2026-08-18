"use client";

import { useEffect, useRef, useState } from "react";
import { api, driverApi, RideMessage } from "@/lib/api";

interface RideChatDrawerProps {
  rideId: string;
  myRole: "CUSTOMER" | "DRIVER";
  otherPartyName: string;
  onClose: () => void;
}

const CUSTOMER_QUICK_CHIPS = [
  "Where are you now?",
  "I am waiting at the pickup spot 📍",
  "Please call me when you arrive",
  "Coming down in 2 minutes",
];

const DRIVER_QUICK_CHIPS = [
  "On my way! See you soon 🚗",
  "I have arrived at the pickup location 📍",
  "Traffic delay, arriving in 5 mins",
  "Please confirm your exact landmark",
];

export default function RideChatDrawer({
  rideId,
  myRole,
  otherPartyName,
  onClose,
}: RideChatDrawerProps) {
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Messages from Backend
  async function loadMessages() {
    try {
      const msgs = myRole === "DRIVER"
        ? await driverApi.getMessages(rideId)
        : await api.getMessages(rideId);
      setMessages(msgs);
    } catch (e) {
      // ignore network errors during poll
    }
  }

  useEffect(() => {
    loadMessages();
    pollIntervalRef.current = setInterval(loadMessages, 2000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId, myRole]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    // Optimistic message
    const tempMsg: RideMessage = {
      id: "temp-" + Date.now(),
      ride_id: rideId,
      sender_id: "me",
      sender_role: myRole,
      sender_name: myRole === "DRIVER" ? "Driver" : "You",
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      if (myRole === "DRIVER") {
        await driverApi.sendMessage(rideId, text);
      } else {
        await api.sendMessage(rideId, text);
      }
      loadMessages();
    } catch (e) {
      // error handling
    } finally {
      setSending(false);
    }
  }

  const quickChips = myRole === "DRIVER" ? DRIVER_QUICK_CHIPS : CUSTOMER_QUICK_CHIPS;
  const isDriver = myRole === "DRIVER";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="relative pointer-events-auto w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden flex flex-col animate-fade-up"
        style={{
          background: "linear-gradient(180deg, #0D1B2E 0%, #081220 100%)",
          border: isDriver ? "1px solid rgba(6,182,212,0.35)" : "1px solid rgba(37,99,235,0.35)",
          borderBottom: "none",
          maxHeight: "80vh",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: isDriver ? "rgba(6,182,212,0.2)" : "rgba(37,99,235,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center text-xl"
              style={{
                background: isDriver
                  ? "linear-gradient(135deg, #0E7490, #06B6D433)"
                  : "linear-gradient(135deg, #1E3A5F, #2563EB40)",
                border: isDriver ? "1px solid rgba(6,182,212,0.4)" : "1px solid rgba(37,99,235,0.4)",
              }}
            >
              {isDriver ? "👤" : "👨‍✈️"}
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">
                {otherPartyName || (isDriver ? "Passenger" : "Driver")}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
                <span className="text-[10px] text-green font-mono">
                  {isDriver ? "Customer Active" : "Online · Your Driver"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl border border-navy-border bg-navy-card flex items-center justify-center text-muted hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[220px]">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm text-white font-medium">
                {isDriver ? "Chat with your passenger" : "Chat with your driver"}
              </p>
              <p className="text-xs text-muted mt-1">Tap a quick reply below or type a message</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.sender_role === myRole;
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Just now";

            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-md ${
                    isMine
                      ? "rounded-br-sm text-white"
                      : "rounded-bl-sm text-slate-200 bg-navy-card border border-navy-border"
                  }`}
                  style={
                    isMine
                      ? {
                          background: isDriver
                            ? "linear-gradient(135deg, #0284C7, #06B6D4)"
                            : "linear-gradient(135deg, #2563EB, #1D4ED8)",
                        }
                      : {}
                  }
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span
                      className={`text-[9px] font-mono ${
                        isMine ? "text-blue-100/70" : "text-muted"
                      }`}
                    >
                      {timeStr}
                    </span>
                    {isMine && <span className="text-[10px] text-cyan-200">✓</span>}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-navy-border/50 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip)}
              className="text-[11px] font-medium text-slate-300 bg-navy-card hover:bg-navy-hover hover:text-white border border-navy-border px-3 py-1.5 rounded-full whitespace-nowrap transition-all active:scale-95 flex-shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div
          className="flex items-center gap-2.5 px-4 py-3.5 border-t border-navy-border flex-shrink-0 bg-navy-deep"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder={isDriver ? "Message passenger…" : "Message driver…"}
            className="flex-1 rounded-2xl bg-navy-card border border-navy-border px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="h-11 w-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-all shadow-lg active:scale-95"
            style={{
              background: input.trim()
                ? isDriver
                  ? "linear-gradient(135deg, #0284C7, #06B6D4)"
                  : "linear-gradient(135deg, #2563EB, #06B6D4)"
                : "#162540",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
