/**
 * groq-translate.ts
 *
 * Server-side utility — dịch văn bản EN → VI bằng Groq API.
 * Dùng cho scraper scripts ONLY, không gọi từ client code.
 *
 * Required env var: GROQ_API_KEY
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Dịch text tiếng Anh sang tiếng Việt.
 * Trả về null nếu API fail hoặc kết quả trống/quá ngắn.
 */
export async function translateToVI(text: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("❌  GROQ_API_KEY not set");
    return null;
  }

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: `Dịch đoạn văn sau sang tiếng Việt. Giữ nguyên tên riêng (tên Stand, tên nhân vật, tên kỹ năng). Chỉ trả về bản dịch, không giải thích, không thêm tiêu đề:\n\n${text}`,
          },
        ],
        max_tokens: 1500,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌  Groq API error ${res.status}: ${err.substring(0, 200)}`);
      return null;
    }

    const data = await res.json();
    const translated: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (translated.length < 20) return null;
    return translated;
  } catch (e) {
    console.error("❌  Groq fetch failed:", e);
    return null;
  }
}
