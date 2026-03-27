import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text: string = body?.text ?? "";
  if (!text.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Bạn là chuyên gia dịch manga/anime. Hãy dịch mô tả năng lực Stand trong JoJo's Bizarre Adventure từ tiếng Anh sang tiếng Việt. Giữ nguyên các tên riêng (tên Stand, tên nhân vật). Chỉ trả về văn bản đã dịch, không kèm ghi chú.",
      },
      { role: "user", content: text },
    ],
    max_tokens: 1500,
    temperature: 0.3,
  });

  const translated = result.choices[0]?.message?.content?.trim() ?? text;
  return NextResponse.json({ translated });
}
