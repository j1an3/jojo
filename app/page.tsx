"use client";

import { useState } from "react";

// ── Thông tin mạng xã hội ─────────────────────────────────────────────────────
const SOCIAL_CARDS = [
  {
    key: "youtube",
    href: "https://www.youtube.com/@jian.joestar",
    platform: "YouTube",
    handle: "@jian.joestar",
    color: "#FF3333",
    bg: "rgba(255,51,51,0.07)",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    key: "tiktok",
    href: "https://www.tiktok.com/@jian.joestar",
    platform: "TikTok",
    handle: "@jian.joestar",
    color: "#ffffff",
    bg: "rgba(255,255,255,0.04)",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.28 8.28 0 0 0 4.84 1.56V6.79a4.85 4.85 0 0 1-1.07-.1z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    href: "https://www.facebook.com/jian.joestar",
    platform: "Facebook",
    handle: "jian.joestar",
    color: "#4A90E2",
    bg: "rgba(74,144,226,0.07)",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────

function QrPanel() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-[#0f0f0f] border border-[#1e1e1e]">
      {/* QR */}
      <div className="flex-shrink-0">
        {failed ? (
          <div className="w-36 h-36 rounded-xl bg-[#1a1a1a] flex flex-col items-center justify-center">
            <span className="text-3xl mb-1">📱</span>
            <span className="text-xs text-[#444] text-center">QR sắp có</span>
          </div>
        ) : (
          <div className="w-36 h-36 rounded-xl overflow-hidden bg-white p-1.5 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/donate-qr.png"
              alt="Mã QR donate"
              width={132}
              height={132}
              className="block w-full h-full object-contain"
              onError={() => setFailed(true)}
            />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 text-center sm:text-left">
        <p className="text-white font-semibold text-sm mb-1">Buy me a coffee</p>
        <p className="text-[#555] text-sm leading-relaxed mb-4">
          Dùng app ngân hàng hoặc ví điện tử quét mã QR bên cạnh. Mọi sự ủng hộ đều giúp mình duy trì kênh!
        </p>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {["MoMo", "VietQR", "ZaloPay", "Ngân hàng"].map((m) => (
            <span
              key={m}
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#161616] border border-[#252525] text-[#555]"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col items-center px-4 py-12 pb-16">
      <div className="w-full max-w-sm">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center mb-10">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full mb-5 overflow-hidden
            border-2 border-[#1E5BFF]/50
            shadow-[0_0_40px_rgba(30,91,255,0.2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/avatar.jpg"
              alt="Jian avatar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>

          <h1
            className="font-manga text-4xl text-white tracking-widest mb-2 leading-none"
            style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
          >
            Jian
          </h1>
          <p className="text-[#555] text-sm leading-relaxed max-w-[260px]">
            Bạn có thể tìm kiếm về Stand, Nhân vật, Gia phả của nhà Joestar ở đây...
          </p>

          {/* Pill tags */}
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {["Stand", "Nhân Vật", "Gia Phả"].map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-3 py-1 rounded-full bg-[#111] border border-[#222] text-[#444]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* ── Mạng xã hội ──────────────────────────────────── */}
        <section className="flex flex-col gap-3 mb-10">
          {SOCIAL_CARDS.map(({ key, href, platform, handle, color, bg, Icon }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl
                border border-[#1c1c1c] hover:border-[#2c2c2c]
                transition-all duration-150 hover:scale-[1.015] active:scale-[0.99]"
              style={{ background: bg }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ color, background: `${color}12`, border: `1px solid ${color}22` }}
              >
                <Icon />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 text-left">
                <div className="text-white font-semibold text-sm leading-none mb-1">{platform}</div>
                <div className="text-[#484848] text-xs">{handle}</div>
              </div>

              {/* Arrow */}
              <svg
                className="w-4 h-4 text-[#2a2a2a] group-hover:text-[#555] transition-colors flex-shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </section>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <span className="text-[#2a2a2a] text-xs tracking-widest uppercase">Ủng hộ</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>

        {/* ── Donate ───────────────────────────────────────── */}
        <section className="mb-12">
          <QrPanel />
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="text-center text-[#272727] text-xs leading-relaxed">
          JoJo Bách Khoa — fan project<br />
          Không liên kết với Hirohiko Araki hay Shueisha
        </footer>

      </div>
    </main>
  );
}
