# Contract: Database — Supabase Public Schema

**Phase 1 Output** — `001-stand-battle-simulator`
**Ngày**: 2026-03-26

Đây là giao diện công khai mà frontend và scraper script tương tác với Supabase.

---

## Bảng `stands` — Public Read

**Access**: `anon` key (read-only từ client)

### Select tất cả Stand

```typescript
// lib/supabase.ts
const { data, error } = await supabase
  .from("stands")
  .select("id, name, type, stats, ability_description, weakness")
  .order("name", { ascending: true });
```

**Response shape:**

```typescript
type StandRow = {
  id: string; // UUID
  name: string; // "Star Platinum"
  type: string; // "Close-Range Stand"
  stats: {
    pow: "A" | "B" | "C" | "D" | "E" | "None";
    spd: "A" | "B" | "C" | "D" | "E" | "None";
    rng: "A" | "B" | "C" | "D" | "E" | "None";
    dur: "A" | "B" | "C" | "D" | "E" | "None";
    prc: "A" | "B" | "C" | "D" | "E" | "None";
    dev: "A" | "B" | "C" | "D" | "E" | "None";
  };
  ability_description: string | null;
  weakness: string | null;
};
```

### Tìm kiếm Stand theo tên

```typescript
const { data } = await supabase
  .from("stands")
  .select("id, name, type, stats")
  .ilike("name", `%${query}%`)
  .limit(20);
```

---

## Bảng `characters` — Public Read

**Access**: `anon` key (read-only từ client)

### Lấy Character kèm Stand name (join)

```typescript
const { data } = await supabase
  .from("characters")
  .select("id, name, part, status, image_url, stands(name)")
  .eq("part", 3);
```

---

## Upsert từ Scraper Script — Service Role Only

**Access**: `SUPABASE_SERVICE_KEY` (server-side only, không bao giờ expose ra client)

### Upsert Stand

```typescript
// scripts/scraper/scrape-stands.ts
const { error } = await supabaseAdmin.from("stands").upsert(
  {
    name: stand.name,
    type: stand.type,
    ability_description: stand.ability_description,
    stats: stand.stats,
    weakness: stand.weakness,
    scraped_at: new Date().toISOString(),
    source_url: stand.source_url,
  },
  { onConflict: "name" }, // upsert theo tên Stand (UNIQUE)
);
```

### Upsert Character

```typescript
const { error } = await supabaseAdmin.from("characters").upsert(
  {
    name: character.name,
    stand_id: resolvedStandId, // UUID lookup by stand name
    part: character.part,
    status: character.status,
  },
  { onConflict: "name" },
);
```

---

## Environment Variables Required

| Variable                        | Dùng bởi        | Mô tả                           |
| ------------------------------- | --------------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client + Server | Supabase project URL            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client          | Public anon key (read-only)     |
| `SUPABASE_SERVICE_KEY`          | Script only     | Service role key (write access) |
