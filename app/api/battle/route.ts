import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildBattlePrompt } from "@/lib/battle-ai";
import type { BattleRequest, BattleResponse } from "@/types/stand";

// Server-side only — GROQ_API_KEY is never sent to the client
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
  // Parse request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  const { standA, standB } = (body as BattleRequest) ?? {};
  if (!standA || !standB) {
    return NextResponse.json(
      { error: "Both standA and standB are required" },
      { status: 400 }
    );
  }
  if (!standA.name || !standB.name) {
    return NextResponse.json(
      { error: "standA.name and standB.name are required" },
      { status: 400 }
    );
  }
  if (!standA.stats || !standB.stats) {
    return NextResponse.json(
      { error: "standA.stats and standB.stats are required" },
      { status: 400 }
    );
  }

  const messages = buildBattlePrompt({ standA, standB });

  try {
    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: BattleResponse;

    try {
      result = JSON.parse(raw) as BattleResponse;
    } catch {
      return NextResponse.json(
        { error: "AI returned malformed JSON" },
        { status: 500 }
      );
    }

    if (!result.explanation || !result.suggestedWinner) {
      return NextResponse.json(
        { error: "AI response missing required fields" },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    console.error("[/api/battle] OpenAI error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
