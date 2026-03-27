"use client";

import { useState } from "react";
import WikiImage from "@/components/WikiImage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  name: string;
  nameVi?: string;
  part?: number;
  stand?: string;
  status?: "alive" | "deceased" | "unknown";
  wikiTitle?: string;
  born?: string;
  nationality?: string;
  role?: string;
  desc?: string;
}

// ─── Màu sắc Part ─────────────────────────────────────────────────────────────

const PART_COLORS: Record<number, string> = {
  1: "#c084fc", 2: "#fb923c", 3: "#60a5fa",
  4: "#4ade80", 5: "#facc15", 6: "#f472b6",
  7: "#a78bfa", 8: "#34d399", 9: "#f87171",
};

const PART_NAMES: Record<number, string> = {
  1: "Phantom Blood",       2: "Battle Tendency",
  3: "Stardust Crusaders",  4: "Diamond is Unbreakable",
  5: "Vento Aureo",         6: "Stone Ocean",
  7: "Steel Ball Run",      8: "JoJolion",
  9: "The JOJOLands",
};

function partColor(part?: number) {
  return part ? (PART_COLORS[part] ?? "#888") : "#444";
}

// ─── Dữ liệu nhân vật ────────────────────────────────────────────────────────

const MEMBERS: Record<string, Member> = {
  george1: {
    name: "George Joestar I", wikiTitle: "George Joestar I",
    born: "1830", nationality: "Anh", status: "deceased",
    role: "Quý tộc người Anh, cha của Jonathan",
    desc: "Người cha nhân từ của Jonathan, coi DIO Brando như con nuôi. Bị DIO sát hại bằng mặt nạ đá.",
  },
  mary: {
    name: "Mary Joestar", wikiTitle: "Mary Joestar",
    born: "1838", nationality: "Anh", status: "deceased",
    role: "Mẹ của Jonathan Joestar",
    desc: "Mất sớm trong vụ tai nạn xe ngựa. Ký ức về bà đã nuôi dưỡng lòng nhân hậu của Jonathan.",
  },
  jonathan: {
    name: "Jonathan Joestar", nameVi: "Jonathan Joestar",
    part: 1, stand: "—",
    wikiTitle: "Jonathan Joestar",
    born: "1868", nationality: "Anh", status: "deceased",
    role: "JoJo thứ nhất — Quý tộc hiệp sĩ",
    desc: "Quý tộc người Anh cao thượng và chân thật. Sử dụng Hamon để chiến đấu với DIO. Hy sinh trên tàu để cứu vợ Erina — tấm gương về lòng dũng cảm của dòng họ Joestar.",
  },
  erina: {
    name: "Erina Pendleton", wikiTitle: "Erina Pendleton",
    born: "1869", nationality: "Anh", status: "alive",
    role: "Vợ Jonathan, người sống sót",
    desc: "Tình yêu đầu đời và vợ của Jonathan. Sống sót sau vụ tàu nổ trong quan tài của DIO, ôm đứa trẻ mồ côi (sau này là Lisa Lisa). Sống thọ đến rất lâu.",
  },
  george2: {
    name: "George Joestar II", wikiTitle: "George Joestar II",
    born: "1904", nationality: "Anh", status: "deceased",
    role: "Phi công RAF, cha của Joseph",
    desc: "Con trai của Jonathan và Erina. Phi công quân đội Anh trong Thế chiến I, học trò Hamon. Bị Kars sát hại khi Joseph còn nhỏ.",
  },
  lisalisa: {
    name: "Lisa Lisa", nameVi: "Lisa Lisa (Elizabeth Joestar)",
    wikiTitle: "Lisa Lisa",
    born: "1889", nationality: "Ý / Anh", status: "alive",
    role: "Bậc thầy Hamon, mẹ ruột Joseph",
    desc: "Được Erina nuôi dưỡng sau khi cha mất trên tàu. Thầy dạy Hamon uy quyền của Joseph và Caesar. Thực ra là mẹ đẻ của Joseph — sự thật chỉ tiết lộ ở cuối Part 2.",
  },
  suzieq: {
    name: "Suzie Q", wikiTitle: "Suzie Q",
    born: "1920s", nationality: "Ý", status: "alive",
    role: "Vợ của Joseph Joestar",
    desc: "Cô gái trẻ người Ý quen biết Joseph sau chiến dịch chống Pillar Men. Vợ của Joseph và bà ngoại của Jotaro.",
  },
  joseph: {
    name: "Joseph Joestar", nameVi: "Joseph Joestar",
    part: 2, stand: "Hermit Purple",
    wikiTitle: "Joseph Joestar",
    born: "1920", nationality: "Anh / Mỹ", status: "deceased",
    role: "JoJo thứ hai — Chiến binh hài hước",
    desc: "Cháu trai của Jonathan, tinh quái và bất cần. Đánh bại Kars bằng mưu kế thiên tài. Ở Part 3 đã là ông già nhưng vẫn dũng cảm. Để lại người con ngoài hôn nhân là Josuke ở Nhật.",
  },
  holy: {
    name: "Holy Kujo", nameVi: "Holy Joestar-Kujo",
    wikiTitle: "Holy Joestar-Kujo",
    born: "1942", nationality: "Mỹ / Nhật", status: "alive",
    role: "Con gái Joseph, mẹ Jotaro",
    desc: "Con gái dịu dàng của Joseph. Khi DIO thức dậy, Stand tự phát triển không kiểm soát được trong cô, gây nguy hiểm tính mạng — chính điều này thôi thúc Jotaro lên đường diệt DIO.",
  },
  sadao: {
    name: "Sadao Kujo", wikiTitle: "Sadao Kujo",
    nationality: "Nhật", status: "alive",
    role: "Nhạc sĩ jazz, cha Jotaro",
    desc: "Nhạc sĩ jazz nổi tiếng người Nhật, chồng của Holy và cha của Jotaro. Ít xuất hiện trực tiếp trong truyện.",
  },
  jotaro: {
    name: "Jotaro Kujo", nameVi: "Jotaro Kujo",
    part: 3, stand: "Star Platinum",
    wikiTitle: "Jotaro Kujo",
    born: "1970", nationality: "Nhật / Mỹ", status: "deceased",
    role: "JoJo thứ ba — Nhân vật biểu tượng của series",
    desc: "Cháu ngoại Joseph, lạnh lùng nhưng sâu sắc. Stand Star Platinum siêu mạnh về tốc độ và sức mạnh vật lý. Hạ gục DIO ở Part 3. Xuất hiện lại ở Part 4, 5, 6. Hy sinh bảo vệ Jolyne ở Part 6.",
  },
  tomoko: {
    name: "Tomoko Higashikata", wikiTitle: "Tomoko Higashikata",
    born: "1970s", nationality: "Nhật", status: "alive",
    role: "Mẹ Josuke (Part 4)",
    desc: "Người phụ nữ Joseph bất chợt phải lòng khi đã lấy vợ. Một mình nuôi dạy Josuke tại thị trấn Morioh — bối cảnh của toàn bộ Part 4.",
  },
  josuke4: {
    name: "Josuke Higashikata", nameVi: "Josuke Higashikata (Part 4)",
    part: 4, stand: "Crazy Diamond",
    wikiTitle: "Josuke Higashikata",
    born: "1983", nationality: "Nhật", status: "alive",
    role: "JoJo thứ tư — Con rơi của Joseph",
    desc: "Con trai ngoài hôn nhân của Joseph, lớn lên ở Morioh. Stand Crazy Diamond sửa chữa và phục hồi mọi vật nhưng không chữa lành được bản thân. Rất nhạy cảm về mái tóc pompadour.",
  },
  jolyne: {
    name: "Jolyne Cujoh", nameVi: "Jolyne Cujoh",
    part: 6, stand: "Stone Free",
    wikiTitle: "Jolyne Cujoh",
    born: "1992", nationality: "Mỹ", status: "deceased",
    role: "JoJo thứ sáu — Con gái Jotaro",
    desc: "Cô gái cứng đầu bị kết oan vào tù Green Dolphin. Stand Stone Free biến cơ thể thành sợi chỉ siêu bền. Hy sinh anh dũng để đặt lại dòng thời gian và cứu người bạn tù Emporio.",
  },
  dio: {
    name: "DIO", wikiTitle: "DIO",
    stand: "The World", born: "1867", nationality: "Anh (gốc)",
    status: "deceased",
    role: "Kẻ thù chính Part 1 & 3 — Chiếm thân Jonathan",
    desc: "Xuất thân nghèo khổ, đầy tham vọng và ác độc. Cướp toàn bộ cơ thể Jonathan Joestar. Stand The World dừng thời gian. Là cha của Giorno cùng ba người con khác ở Part 6 — di sản tội lỗi vẫn còn đó.",
  },
  giorno: {
    name: "Giorno Giovanna", nameVi: "Giorno Giovanna",
    part: 5, stand: "Gold Experience",
    wikiTitle: "Giorno Giovanna",
    born: "1985", nationality: "Ý", status: "alive",
    role: "JoJo thứ năm — Con trai DIO × Joestar",
    desc: "Con trai DIO sinh ra trong thân xác Jonathan, mang cả dòng máu Joestar. Mơ ước trở thành Gangstar chân chính. Gold Experience Requiem vô hiệu hóa mọi hành động — đã đánh bại Diavolo thành công.",
  },
  donatello: {
    name: "Donatello Versus", wikiTitle: "Donatello Versus",
    stand: "Under World", status: "deceased",
    role: "Con trai DIO (Part 6)",
    desc: "Một trong ba người con của DIO ở Part 6. Stand Under World kéo ký ức thảm họa từ lòng đất thành hiện thực.",
  },
  rikiel: {
    name: "Rikiel", wikiTitle: "Rikiel",
    stand: "Sky High", status: "unknown",
    role: "Con trai DIO (Part 6)",
    desc: "Con trai DIO đi tìm ý nghĩa tồn tại. Stand Sky High điều khiển sinh vật cỡ centimet rơi từ bầu trời.",
  },
  ungalo: {
    name: "Ungalo", wikiTitle: "Ungalo",
    stand: "Bohemian Rhapsody", status: "unknown",
    role: "Con trai DIO (Part 6)",
    desc: "Con trai DIO lớn lên trong bần cùng và cô đơn. Stand Bohemian Rhapsody mang nhân vật hư cấu vào đời thực.",
  },
  // SBR Universe
  nicholas: {
    name: "Nicholas Joestar", wikiTitle: "Nicholas Joestar",
    born: "1870s", nationality: "Mỹ", status: "deceased",
    role: "Anh trai của Johnny",
    desc: "Tay đua ngựa tài năng và là anh trai được Johnny ngưỡng mộ. Cái chết do tai nạn đua ngựa dẫn đến bi kịch khiến Johnny bị liệt.",
  },
  johnny: {
    name: "Johnny Joestar", nameVi: "Johnny Joestar",
    part: 7, stand: "Tusk",
    wikiTitle: "Johnny Joestar",
    born: "1872", nationality: "Mỹ", status: "deceased",
    role: "JoJo thứ bảy — Tay đua liệt hai chân",
    desc: "Từ tay đua nổi tiếng rơi xuống tàn phế vì bị bắn, tìm lại sức mạnh qua Steel Ball Run. Stand Tusk phát triển 4 giai đoạn (Act) xoay trôn ốc thần thánh, cuối cùng đạt Tusk Act 4 — vô địch.",
  },
  rina: {
    name: "Rina Higashikata", wikiTitle: "Rina Higashikata",
    nationality: "Nhật", status: "deceased",
    role: "Vợ Johnny Joestar",
    desc: "Vợ người Nhật của Johnny, bị căn bệnh Vòm Đá (Locacaca) hành hạ. Chính căn bệnh của cô là lý do Johnny tìm kiếm Thánh tích để chữa lành.",
  },
  gappy: {
    name: "Josuke Higashikata", nameVi: "Josuke 'Gappy' Higashikata",
    part: 8, stand: "Soft & Wet",
    wikiTitle: "Josuke Higashikata (JoJolion)",
    born: "ca. 2011", nationality: "Nhật", status: "alive",
    role: "JoJo thứ tám — Hợp thể hai linh hồn",
    desc: "Được tạo ra bởi hợp thể hai người qua Rock Disease. Có 4 quả cầu mắt và lưỡi chia đôi. Stand Soft & Wet tạo bong bóng xà phòng cướp đoạt thuộc tính của mọi vật.",
  },
  kiraAlt: {
    name: "Yoshikage Kira (alt)", wikiTitle: "Yoshikage Kira (JoJolion)",
    stand: "Killer Queen (JoJolion)", status: "deceased",
    role: "Một nửa linh hồn của Gappy",
    desc: "Bác sĩ hải quân tử tế (khác biệt hoàn toàn với Kira Part 4). Hợp thể với Josefumi qua Rock Disease tạo ra Gappy.",
  },
  josefumi: {
    name: "Josefumi Kujo", wikiTitle: "Josefumi Kujo",
    stand: "Soft & Wet (nguyên bản)", status: "deceased",
    role: "Một nửa linh hồn của Gappy",
    desc: "Thanh niên người Nhật sở hữu Stand Soft & Wet. Bạn thân của Kira. Hợp thể với Kira qua Rock Disease tạo nên Gappy.",
  },
  jodio: {
    name: "Jodio Joestar", nameVi: "Jodio Joestar",
    part: 9, stand: "November Rain",
    wikiTitle: "Jodio Joestar",
    born: "2009", nationality: "Mỹ (Hawaii)", status: "alive",
    role: "JoJo thứ chín — Cậu thiếu niên Hawaii",
    desc: "Thiếu niên sống ở Hawaii, làm việc cho băng nhóm tội phạm địa phương. Stand November Rain tạo những giọt mưa cực nặng. Đang trên hành trình tìm viên đá quý bí ẩn ở Colombia.",
  },
  jota: {
    name: "Jota McGregor", wikiTitle: "Jota McGregor",
    nationality: "Mỹ", status: "alive",
    role: "Cha của Jodio (vũ trụ SBR)",
    desc: "Con trai của Joseph Joestar và Penelope de la Rosa trong vũ trụ Steel Ball Run. Cha ruột của Jodio Joestar.",
  },
};

// ─── Member Card ──────────────────────────────────────────────────────────────

function MemberCard({ id, onClick }: { id: string; onClick: (id: string) => void }) {
  const m = MEMBERS[id];
  if (!m) return null;
  const c = partColor(m.part);
  const wt = m.wikiTitle ?? m.name;

  return (
    <button
      onClick={() => onClick(id)}
      className="group flex flex-col items-center gap-1 rounded-2xl border transition-all hover:scale-105 hover:shadow-xl cursor-pointer text-center"
      style={{ borderColor: `${c}35`, background: `${c}08`, minWidth: 108, maxWidth: 130, padding: 8 }}
    >
      <WikiImage
        title={wt} size={140}
        className="w-full aspect-[3/4] object-cover rounded-xl bg-[#111] group-hover:brightness-110 transition-all"
        fallback="👤"
      />
      {m.part && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ color: c, background: `${c}22` }}
        >
          Part {m.part}
        </span>
      )}
      <span className="text-white text-[10px] font-semibold leading-snug line-clamp-2">
        {m.nameVi ?? m.name}
      </span>
      {m.stand && m.stand !== "—" && (
        <span className="text-[9px] opacity-50 line-clamp-1">⭐ {m.stand}</span>
      )}
      <span className="text-[9px] opacity-40">
        {m.status === "deceased" ? "🕊" : m.status === "alive" ? "✓" : ""}
      </span>
    </button>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function MemberModal({ id, onClose }: { id: string; onClose: () => void }) {
  const m = MEMBERS[id];
  if (!m) return null;
  const c = partColor(m.part);
  const wt = m.wikiTitle ?? m.name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0f0f0f] border border-[#222] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1" style={{ background: `linear-gradient(to right, ${c}, ${c}44)` }} />
        <div className="p-5">
          <div className="flex gap-4 mb-4">
            <WikiImage
              title={wt} size={220}
              className="w-28 h-36 object-cover rounded-xl flex-shrink-0 bg-[#111]"
              fallback="👤"
            />
            <div className="flex-1 min-w-0">
              {m.part && (
                <div className="text-[10px] font-bold mb-0.5" style={{ color: c }}>
                  Part {m.part} — {PART_NAMES[m.part]}
                </div>
              )}
              <h2
                className="text-xl font-bold text-white leading-tight mb-1"
                style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
              >
                {m.nameVi ?? m.name}
              </h2>
              {m.role && <p className="text-xs text-[#777] mb-3 leading-snug">{m.role}</p>}
              <div className="space-y-1 text-xs">
                {m.born && (
                  <div className="flex gap-2">
                    <span className="text-[#555] w-16 shrink-0">Sinh</span>
                    <span className="text-[#bbb]">{m.born}</span>
                  </div>
                )}
                {m.nationality && (
                  <div className="flex gap-2">
                    <span className="text-[#555] w-16 shrink-0">Quốc tịch</span>
                    <span className="text-[#bbb]">{m.nationality}</span>
                  </div>
                )}
                {m.stand && m.stand !== "—" && (
                  <div className="flex gap-2">
                    <span className="text-[#555] w-16 shrink-0">Stand</span>
                    <span className="font-semibold" style={{ color: "#1E5BFF" }}>⭐ {m.stand}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-[#555] w-16 shrink-0">Tình trạng</span>
                  <span className={m.status === "deceased" ? "text-red-400" : m.status === "alive" ? "text-green-400" : "text-[#777]"}>
                    {m.status === "deceased" ? "🕊 Đã mất" : m.status === "alive" ? "✓ Còn sống" : "Không rõ"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {m.desc && (
            <p className="text-sm text-[#aaa] leading-relaxed border-t border-[#1a1a1a] pt-4">
              {m.desc}
            </p>
          )}

          {m.wikiTitle && (
            <a
              href={`https://jojo.fandom.com/wiki/${encodeURIComponent(m.wikiTitle.replace(/ /g, "_"))}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#444] hover:text-[#1E5BFF] transition-colors mt-3"
            >
              📖 Xem trên JoJo Wiki ↗
            </a>
          )}
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#555] hover:text-white transition-colors"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function VLine() {
  return <div className="w-0.5 h-5 bg-[#252525] mx-auto" />;
}

type Branch = { id: string; label?: string };

function TreeRow({
  parentNode,
  branches,
  onClick,
}: {
  parentNode: React.ReactNode;
  branches: Branch[];
  onClick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      {parentNode}
      {branches.length > 0 && (
        <>
          <VLine />
          {branches.length > 1 && <div className="h-0.5 w-full max-w-md bg-[#252525]" />}
          <div className="flex flex-wrap justify-center gap-5 items-start">
            {branches.map(({ id, label }) => (
              <div key={id} className="flex flex-col items-center gap-0.5">
                <VLine />
                {label && <div className="text-[9px] text-[#444] italic mb-1 text-center">{label}</div>}
                <MemberCard id={id} onClick={onClick} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Couple({
  aId, bId, note, onClick,
}: {
  aId: string; bId?: string; note?: string; onClick: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 justify-center flex-wrap">
      <MemberCard id={aId} onClick={onClick} />
      {bId && (
        <>
          <div className="flex flex-col items-center">
            <span className="text-[#333] text-xl font-bold">×</span>
            {note && <span className="text-[9px] text-[#444] italic">{note}</span>}
          </div>
          <MemberCard id={bId} onClick={onClick} />
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FamilyTreePage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
      <header className="mb-8">
        <h1
          className="font-manga text-4xl md:text-5xl text-white tracking-wider mb-1"
          style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
        >
          Gia Phả Nhà Joestar
        </h1>
        <p className="text-[#555] text-sm">Nhấn vào nhân vật để xem chi tiết · Ảnh tải từ JoJo Wiki</p>
        <p className="text-[#333] text-xs mt-1 sm:hidden">↔ Vuốt ngang để xem toàn bộ cây</p>
      </header>

      {/* Legend */}
      <div className="flex gap-3 mb-8 p-3 bg-[#0e0e0e] rounded-xl border border-[#1a1a1a] overflow-x-auto no-scrollbar">
        {[1,2,3,4,5,6].map((p) => (
          <div key={p} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: PART_COLORS[p] }} />
            <span className="text-[#555]">Part {p}</span>
          </div>
        ))}
        <div className="h-4 w-px bg-[#222] mx-1 self-center" />
        <span className="text-[9px] text-[#444]">🕊 Đã mất</span>
        <span className="text-[9px] text-[#444] ml-2">✓ Còn sống</span>
      </div>

      {/* ─── VŨ TRỤ CHÍNH (Parts 1–6) ─── */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-manga text-2xl text-white tracking-widest"
            style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}>
            Vũ Trụ Chính
          </h2>
          <div className="h-px flex-1 bg-[#1a1a1a]" />
          <span className="text-xs text-[#444]">Parts 1–6</span>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[860px] flex flex-col items-center gap-0">
            {/* Generation 1 */}
            <TreeRow
              parentNode={<Couple aId="george1" bId="mary" onClick={setSelected} />}
              branches={[{ id: "jonathan" }]}
              onClick={setSelected}
            />

            {/* Jonathan × Erina */}
            <VLine />
            <TreeRow
              parentNode={<Couple aId="jonathan" bId="erina" onClick={setSelected} />}
              branches={[{ id: "george2" }]}
              onClick={setSelected}
            />

            {/* George II × Lisa Lisa */}
            <VLine />
            <TreeRow
              parentNode={<Couple aId="george2" bId="lisalisa" onClick={setSelected} />}
              branches={[{ id: "joseph" }]}
              onClick={setSelected}
            />

            {/* Joseph — two branches */}
            <VLine />
            <div className="flex gap-14 justify-center flex-wrap items-start">
              {/* Main: Suzie Q → Holy → Jotaro → Jolyne */}
              <div className="flex flex-col items-center gap-0">
                <TreeRow
                  parentNode={<Couple aId="joseph" bId="suzieq" note="vợ" onClick={setSelected} />}
                  branches={[{ id: "holy" }]}
                  onClick={setSelected}
                />
                <VLine />
                <TreeRow
                  parentNode={<Couple aId="holy" bId="sadao" note="chồng" onClick={setSelected} />}
                  branches={[{ id: "jotaro" }]}
                  onClick={setSelected}
                />
                <VLine />
                <TreeRow
                  parentNode={<MemberCard id="jotaro" onClick={setSelected} />}
                  branches={[{ id: "jolyne", label: "con gái" }]}
                  onClick={setSelected}
                />
              </div>

              {/* Affair: Tomoko → Josuke */}
              <div className="flex flex-col items-center mt-36">
                <div className="text-[9px] text-[#444] italic mb-2 text-center">ngoài hôn&nbsp;nhân</div>
                <TreeRow
                  parentNode={<MemberCard id="tomoko" onClick={setSelected} />}
                  branches={[{ id: "josuke4" }]}
                  onClick={setSelected}
                />
              </div>
            </div>
          </div>
        </div>

        {/* DIO branch */}
        <div className="mt-12 pt-8 border-t border-[#1a1a1a]">
          <p className="text-xs text-[#444] italic text-center mb-6">
            DIO chiếm đoạt thân xác Jonathan Joestar → sinh 4 người con mang dòng máu Joestar
          </p>
          <TreeRow
            parentNode={<MemberCard id="dio" onClick={setSelected} />}
            branches={[
              { id: "giorno", label: "Part 5 · Ý" },
              { id: "donatello", label: "Part 6" },
              { id: "rikiel",    label: "Part 6" },
              { id: "ungalo",    label: "Part 6" },
            ]}
            onClick={setSelected}
          />
        </div>
      </section>

      {/* ─── VŨ TRỤ SBR (Parts 7–9) ─── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-manga text-2xl text-white tracking-widest"
            style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}>
            Vũ Trụ Steel Ball Run
          </h2>
          <div className="h-px flex-1 bg-[#1a1a1a]" />
          <span className="text-xs text-[#444]">Parts 7–9</span>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[700px]">
            {/* Johnny → Jodio line */}
            <div className="flex flex-col items-center mb-10">
              <div className="text-[9px] text-[#444] italic mb-1">anh trai</div>
              <MemberCard id="nicholas" onClick={setSelected} />
              <VLine />
              <TreeRow
                parentNode={<Couple aId="johnny" bId="rina" onClick={setSelected} />}
                branches={[{ id: "jota", label: "dòng dõi tiếp nối" }]}
                onClick={setSelected}
              />
              <VLine />
              <MemberCard id="jodio" onClick={setSelected} />
            </div>

            {/* Gappy fusion */}
            <div className="p-5 bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl">
              <p className="text-xs text-[#444] italic text-center mb-4">
                Part 8 — Hợp thể hai linh hồn qua Bệnh Đá (Rock Disease)
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <MemberCard id="kiraAlt" onClick={setSelected} />
                <span className="text-[#333] text-2xl font-bold">+</span>
                <MemberCard id="josefumi" onClick={setSelected} />
                <span className="text-[#333] text-2xl">→</span>
                <MemberCard id="gappy" onClick={setSelected} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legend SBR */}
      <div className="flex flex-wrap gap-3 mt-6">
        {[7,8,9].map((p) => (
          <div key={p} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: PART_COLORS[p] }} />
            <span className="text-[#555]">Part {p} — {PART_NAMES[p]}</span>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl text-xs text-[#444] leading-relaxed">
        <strong className="text-[#555]">Lưu ý:</strong> Parts 7–9 diễn ra trong vũ trụ song song với các phiên bản khác nhau của gia đình Joestar. Dấu hiệu &ldquo;ngôi sao Joestar&rdquo; vẫn xuất hiện, nối liền huyết thống qua các chiều thời gian.
      </div>

      {/* Modal */}
      {selected && <MemberModal id={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
