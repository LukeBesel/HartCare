"use client";

import { PageHeader } from "@/components/ui";
import { COACH_SUGGESTIONS } from "@/lib/coach";
import { useTodayStats } from "@/lib/hooks";
import { useCurrentProfile, useSettings } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Bot, Loader2, SendHorizonal, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function renderMarkdown(text: string) {
  // Lightweight markdown: bold, italics, headings, bullets.
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-2" />;
    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>");
    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-brand-500 mt-0.5">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
        </div>
      );
    }
    return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
  });
}

export default function CoachPage() {
  const profile = useCurrentProfile();
  const settings = useSettings();
  const stats = useTodayStats();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Hi ${profile.name}! 👋 I'm your HartCare coach. I can build workout and meal plans, suggest recipes and grocery lists, set hydration goals and analyze your trends. What would you like help with today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    const next = [...messages, { role: "user" as const, content: msg }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-8),
          context: {
            name: profile.name,
            weightLbs: stats.latestWeight,
            calorieTarget: stats.calorieTarget,
            waterGoalOz: settings.waterGoalOz,
          },
        }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply ?? "Sorry, I couldn't respond just now." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="AI Health Coach"
        subtitle="Plans, recipes, grocery lists and trends — wellness guidance, never a diagnosis."
      />

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <span
                className={cn(
                  "grid place-items-center h-9 w-9 rounded-xl shrink-0",
                  m.role === "assistant" ? "bg-brand-600 text-white" : "bg-surface-muted text-text",
                )}
              >
                {m.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
              </span>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "assistant"
                    ? "bg-surface-muted text-text rounded-tl-sm"
                    : "bg-brand-600 text-white rounded-tr-sm",
                )}
              >
                {m.role === "assistant" ? <div className="space-y-0.5">{renderMarkdown(m.content)}</div> : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand-600 text-white">
                <Bot size={18} />
              </span>
              <div className="rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-3 text-sm text-text-muted flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 sm:px-6 pb-2 flex flex-wrap gap-2">
            {COACH_SUGGESTIONS.slice(0, 5).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="chip bg-surface-muted text-text-muted hover:text-text hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
              >
                <Sparkles size={12} /> {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-border p-3 flex items-center gap-2"
        >
          <input
            className="input flex-1"
            placeholder="Ask your coach anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary px-4" disabled={loading || !input.trim()}>
            <SendHorizonal size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
