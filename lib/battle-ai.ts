import type OpenAI from "openai";
import type { BattleRequest } from "@/types/stand";

/**
 * Builds the message array for the OpenAI chat completion request.
 * Called server-side only from app/api/battle/route.ts.
 */
export function buildBattlePrompt(
  req: BattleRequest
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const systemMessage = `Bạn là chuyên gia phân tích trận đấu trong vũ trụ JoJo's Bizarre Adventure.
Nhiệm vụ của bạn là phân tích hai Stand và xác định Stand nào có nhiều khả năng chiến thắng hơn trong một trận đấu trực tiếp.

Hãy xem xét:
- Các chỉ số lục giác (Power, Speed, Range, Durability, Precision, Development Potential)
- Loại Stand (Close-Range, Long-Range, Automatic, v.v.)
- Mô tả năng lực đặc biệt và điểm yếu
- Bối cảnh trong manga/anime nếu có thể (có thể tham chiếu các phân tích death battle từ cộng đồng)

**Quy tắc đầu ra:**
- Trả lời hoàn toàn bằng tiếng Việt
- Giải thích từ 100 đến 200 từ — có chiều sâu và lý giải cụ thể, không chung chung
- BẮT BUỘC đề cập tên của cả hai Stand trong phần giải thích
- BẮT BUỘC dẫn chứng ít nhất một chỉ số hoặc loại Stand cụ thể
- Nếu hai Stand quá cân bằng, trả về "Hòa" làm suggestedWinner
- Trả về JSON hợp lệ, đúng schema sau — không thêm comment hay markdown:

{
  "explanation": "string",
  "suggestedWinner": "string"
}`;

  const userMessage = `Phân tích trận đấu giữa hai Stand sau:

Stand A:
${JSON.stringify(req.standA, null, 2)}

Stand B:
${JSON.stringify(req.standB, null, 2)}`;

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}
