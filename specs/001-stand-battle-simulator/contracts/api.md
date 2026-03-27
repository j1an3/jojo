# Contract: API — POST /api/battle

**Phase 1 Output** — `001-stand-battle-simulator`
**Ngày**: 2026-03-26

---

## Endpoint

```
POST /api/battle
Content-Type: application/json
```

**Mục đích**: Nhận 2 Stand objects từ client, gọi LLM để tạo lý giải trận đấu bằng
tiếng Việt, trả về kết quả phân tích.

---

## Request

```typescript
type BattleRequest = {
  standA: {
    name: string;
    type: string;
    ability_description: string | null;
    stats: {
      pow: string; // "A"|"B"|"C"|"D"|"E"|"None"
      spd: string;
      rng: string;
      dur: string;
      prc: string;
      dev: string;
    };
    weakness: string | null;
  };
  standB: {
    // Cùng shape với standA
    name: string;
    type: string;
    ability_description: string | null;
    stats: {
      pow: string;
      spd: string;
      rng: string;
      dur: string;
      prc: string;
      dev: string;
    };
    weakness: string | null;
  };
};
```

**Ví dụ request body:**

```json
{
  "standA": {
    "name": "Star Platinum",
    "type": "Close-Range Stand",
    "ability_description": "Sức mạnh và tốc độ tối thượng, dừng thời gian.",
    "stats": {
      "pow": "A",
      "spd": "A",
      "rng": "C",
      "dur": "A",
      "prc": "A",
      "dev": "A"
    },
    "weakness": "Phạm vi 2m"
  },
  "standB": {
    "name": "The World",
    "type": "Close-Range Stand",
    "ability_description": "Dừng thời gian. Sức mạnh tương đương Star Platinum.",
    "stats": {
      "pow": "A",
      "spd": "A",
      "rng": "C",
      "dur": "A",
      "prc": "A",
      "dev": "A"
    },
    "weakness": "Điểm yếu ở chân"
  }
}
```

---

## Response

### 200 OK — Thành công

```typescript
type BattleResponse = {
  explanation: string; // Lý giải tiếng Việt, 100–200 từ
  suggestedWinner: string; // Tên Stand thắng hoặc "Hòa"
};
```

```json
{
  "explanation": "Trong điều kiện trận đấu 1v1 trung lập, cuộc chiến giữa Star Platinum và The World là một trong những trận đấu huyền thoại nhất trong JoJo's Bizarre Adventure...",
  "suggestedWinner": "Star Platinum"
}
```

### 400 Bad Request — Thiếu hoặc sai dữ liệu

```json
{
  "error": "standA và standB là bắt buộc"
}
```

### 500 Internal Server Error — LLM/API lỗi

```json
{
  "error": "Không thể phân tích trận đấu. Vui lòng thử lại."
}
```

---

## Validation

Server phải kiểm tra trước khi gọi LLM:

- `standA.name` và `standB.name` không rỗng
- `standA.name !== standB.name` (không cho phép cùng Stand)
- Tổng độ dài `ability_description` của 2 Stand ≤ 2000 ký tự (tránh prompt injection)

---

## Prompt Template (server-side, không expose)

Xem [research.md § 3 — AI Prompt Strategy](../research.md) để biết nội dung đầy đủ
của system prompt và user prompt được sử dụng trong route handler.

---

## Performance

- **Timeout**: 15 giây (client tự retry nếu quá thời gian)
- **Max output tokens**: 400
- **Temperature**: 0.7
