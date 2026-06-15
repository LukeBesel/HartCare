import { coachReply, COACH_DISCLAIMER, type CoachContext } from "@/lib/coach";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM = `You are the HartCare AI Health Coach for a family wellness app.
You build workout plans, meal plans, recipes, grocery lists, hydration and calorie
guidance, recovery plans, and analyze trends. Be warm, concise and practical, and
format with short markdown sections and bullet lists.
CRITICAL: You provide wellness and lifestyle guidance only. You never diagnose,
never name specific medical conditions as conclusions, and never recommend
prescription changes. For anything medical, advise seeing a licensed professional.`;

interface Body {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  context?: CoachContext;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.COACH_MODEL || "claude-opus-4-8";

  // Live Claude path (used only when an API key is configured).
  if (apiKey) {
    try {
      const messages = [
        ...(body.history ?? []).slice(-8),
        { role: "user" as const, content: message },
      ];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: SYSTEM + (body.context ? `\n\nUser context: ${JSON.stringify(body.context)}` : ""),
          messages,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { content?: { text?: string }[] };
        const text = data.content?.map((c) => c.text ?? "").join("") || coachReply(message, body.context);
        return NextResponse.json({ reply: text, source: "claude" });
      }
      // fall through to local on API error
    } catch {
      // fall through to local on network error
    }
  }

  // Offline knowledge engine (default).
  const reply = coachReply(message, body.context);
  return NextResponse.json({ reply, source: "local", disclaimer: COACH_DISCLAIMER });
}
