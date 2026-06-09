"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Gem,
  Headphones,
  Percent,
  Search,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import { clientApi } from "./clientApi";
import Header from "./components/Header";

type GameTheme = {
  from: string;
  to: string;
  accent: string;
  soft: string;
  label: string;
  symbol: string;
};

const DEFAULT_GAME_THEME: GameTheme = {
  from: "#071a45",
  to: "#0f766e",
  accent: "#67e8f9",
  soft: "#0e7490",
  label: "TOP UP",
  symbol: "TS",
};

const GAME_THEMES: Record<string, GameTheme> = {
  genshin: {
    from: "#24524f",
    to: "#d29b36",
    accent: "#fde68a",
    soft: "#38bdf8",
    label: "ADVENTURE",
    symbol: "GI",
  },
  zenless: {
    from: "#111827",
    to: "#f59e0b",
    accent: "#fef08a",
    soft: "#38bdf8",
    label: "ACTION",
    symbol: "ZZ",
  },
  starrail: {
    from: "#172554",
    to: "#7c3aed",
    accent: "#bfdbfe",
    soft: "#facc15",
    label: "GALAXY",
    symbol: "SR",
  },
  honkai: {
    from: "#312e81",
    to: "#db2777",
    accent: "#f9a8d4",
    soft: "#93c5fd",
    label: "IMPACT",
    symbol: "HI",
  },
  wuthering: {
    from: "#082f49",
    to: "#16a34a",
    accent: "#bbf7d0",
    soft: "#38bdf8",
    label: "WAVES",
    symbol: "WW",
  },
  mlbb: {
    from: "#082f49",
    to: "#1d4ed8",
    accent: "#facc15",
    soft: "#67e8f9",
    label: "MOBA",
    symbol: "ML",
  },
  honor: {
    from: "#1e3a8a",
    to: "#b45309",
    accent: "#fde68a",
    soft: "#60a5fa",
    label: "ARENA",
    symbol: "HK",
  },
  identity: {
    from: "#1f2937",
    to: "#7f1d1d",
    accent: "#fecaca",
    soft: "#a78bfa",
    label: "UID",
    symbol: "ID",
  },
  punishing: {
    from: "#020617",
    to: "#475569",
    accent: "#e2e8f0",
    soft: "#22d3ee",
    label: "RAVEN",
    symbol: "PR",
  },
  deepspace: {
    from: "#581c87",
    to: "#0f766e",
    accent: "#f0abfc",
    soft: "#67e8f9",
    label: "LOVE",
    symbol: "LD",
  },
};

const getGameKey = (game: any) => {
  return `${game?.gamecode || ""} ${game?.name || ""}`.toLowerCase().replace(/\s+/g, "");
};

const getGameTheme = (game: any) => {
  const key = getGameKey(game);

  if (key.includes("zzz") || key.includes("zenless")) return GAME_THEMES.zenless;
  if (key.includes("starrail") || key.includes("hsr")) return GAME_THEMES.starrail;
  if (key.includes("honkai")) return GAME_THEMES.honkai;
  if (key.includes("genshin") || key.includes("mihoyo")) return GAME_THEMES.genshin;
  if (key.includes("wuther") || key.includes("kuro")) return GAME_THEMES.wuthering;
  if (key.includes("mobilelegends") || key.includes("mlbb")) return GAME_THEMES.mlbb;
  if (key.includes("honorofkings")) return GAME_THEMES.honor;
  if (key.includes("identity")) return GAME_THEMES.identity;
  if (key.includes("punishing")) return GAME_THEMES.punishing;
  if (key.includes("deepspace")) return GAME_THEMES.deepspace;

  return DEFAULT_GAME_THEME;
};

const getInitials = (name: string) => {
  const cleanName = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return (initials || "TS").toUpperCase();
};

const escapeSvgText = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const createGameImage = (game: any) => {
  const theme = getGameTheme(game);
  const title = String(game?.name || "Game").slice(0, 32);
  const safeTitle = escapeSvgText(title);
  const initials = getInitials(title);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.from}" />
          <stop offset="100%" stop-color="${theme.to}" />
        </linearGradient>
        <radialGradient id="flare" cx="72%" cy="36%" r="58%">
          <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.85" />
          <stop offset="52%" stop-color="${theme.soft}" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="960" height="600" fill="url(#bg)" />
      <rect width="960" height="600" fill="url(#flare)" />
      <path d="M-60 456 C190 340 350 540 560 390 C720 274 805 292 1040 164" fill="none" stroke="${theme.accent}" stroke-width="18" stroke-opacity="0.28" />
      <path d="M-80 510 C240 364 404 558 632 388 C780 278 850 300 1040 220" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.18" />
      <circle cx="724" cy="156" r="118" fill="${theme.accent}" opacity="0.12" />
      <circle cx="736" cy="156" r="78" fill="none" stroke="${theme.accent}" stroke-width="4" stroke-opacity="0.55" />
      <circle cx="736" cy="156" r="126" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.16" />
      <g filter="url(#glow)">
        <text x="735" y="188" text-anchor="middle" font-family="Arial, sans-serif" font-size="74" font-weight="900" fill="#ffffff">${theme.symbol}</text>
      </g>
      <rect x="62" y="62" width="236" height="82" rx="20" fill="#020617" fill-opacity="0.34" stroke="#ffffff" stroke-opacity="0.12" />
      <text x="88" y="100" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="${theme.accent}" letter-spacing="3">${theme.label}</text>
      <text x="88" y="130" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#e5e7eb" opacity="0.78">SHOP THINH SANG</text>
      <text x="70" y="432" font-family="Arial, sans-serif" font-size="112" font-weight="900" fill="#ffffff" opacity="0.95">${initials}</text>
      <text x="74" y="480" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#ffffff" opacity="0.92">${safeTitle}</text>
      <text x="76" y="516" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${theme.accent}" opacity="0.95">Nap nhanh - An toan - Gia tot</text>
      <g opacity="0.24">
        <circle cx="840" cy="460" r="8" fill="#ffffff" />
        <circle cx="790" cy="508" r="5" fill="${theme.accent}" />
        <circle cx="866" cy="96" r="6" fill="${theme.accent}" />
        <circle cx="520" cy="96" r="4" fill="#ffffff" />
        <circle cx="620" cy="520" r="6" fill="#ffffff" />
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default function ClientHomePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadStoreData() {
      try {
        const gamesList = await clientApi.getGames();
        setGames(Array.isArray(gamesList) ? gamesList : []);
      } catch (error) {
        console.error(error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    }

    loadStoreData();
  }, []);

  const filteredGames = games
    .filter(
      (game) =>
        game?.name?.toLowerCase().includes(search.toLowerCase()) &&
        (!game.status || game.status === "active"),
    )
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const popularSearches = ["Genshin", "Honkai", "Mobile Legends", "Honor"];

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-sans text-zinc-900 selection:bg-blue-600/30">
      <div className="relative overflow-hidden bg-[#374669] text-white">
        <Header />

        <section className="relative flex min-h-[580px] items-start overflow-hidden sm:min-h-[400px] sm:items-center lg:min-h-[500px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-moba-bg.png"
            alt="Shop Thịnh Sáng hero banner"
            className="absolute inset-0 hidden h-full w-full object-cover object-center sm:block"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-moba-mobile-bg.png"
            alt="Shop Thịnh Sáng mobile hero banner"
            className="absolute inset-0 h-full w-full object-cover object-center sm:hidden"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(55,70,105,0.85)_0%,rgba(55,70,105,0.45)_34%,rgba(55,70,105,0.15)_64%,rgba(55,70,105,0.65)_100%)] sm:bg-[linear-gradient(90deg,rgba(55,70,105,0.98)_0%,rgba(55,70,105,0.88)_34%,rgba(55,70,105,0.28)_68%,rgba(55,70,105,0.15)_100%)]" />

          <div className="relative z-10 mx-auto flex w-full max-w-[1400px] justify-center px-4 sm:justify-start sm:px-6">
            <div className="mx-auto flex max-w-[360px] flex-col items-center pb-16 pt-7 text-center sm:mx-0 sm:max-w-2xl sm:items-start sm:pb-24 sm:pt-10 sm:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/35 bg-blue-500/10 px-4 py-2 text-[10px] font-extrabold uppercase text-blue-100 backdrop-blur-md sm:mb-5 sm:text-xs">
                <Zap className="h-4 w-4 text-blue-300" />
                Nạp game tự động 24/7
              </div>

              <h1 className="max-w-xl text-5xl font-black uppercase leading-[1.08] tracking-tighter text-white sm:text-6xl lg:text-7xl">
                <span className="block drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">SHOP</span>
                <span className="block bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(34,211,238,0.15)]">THỊNH SÁNG</span>
              </h1>
              <p className="mt-4 max-w-[300px] text-[11px] font-semibold leading-5 text-cyan-50/90 sm:mt-6 sm:max-w-xl sm:text-base sm:leading-7 lg:text-lg">
                Nạp UID game Rẻ Nhanh chóng chất lượng
              </p>

              <div className="mt-5 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap">
                <a
                  href="#games-list"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-5 py-3 text-xs font-extrabold uppercase text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:scale-[1.02] active:scale-[0.98] sm:text-sm"
                >
                  <Gem className="h-4 w-4" />
                  Nạp game ngay
                </a>
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-extrabold uppercase text-white backdrop-blur-md transition hover:bg-white/20 active:scale-[0.98] sm:text-sm"
                >
                  <Smartphone className="h-4 w-4" />
                  Nạp ví
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <main id="games-list" className="relative z-20 mx-auto -mt-10 w-full max-w-[1400px] px-4 pb-14 sm:-mt-14 sm:px-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-[0_24px_80px_rgba(15,23,42,0.13)] sm:p-7">
          <div className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-blue-600 sm:text-xs sm:tracking-normal">Danh sách game</p>
              <h2 className="mt-2 text-2xl font-black uppercase text-zinc-950">Game nổi bật</h2>

            </div>

            <div className="w-full max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600" />
                <input
                  type="text"
                  placeholder="Tìm kiếm game bạn muốn nạp..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-14 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-sm font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="pt-7">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
                <p className="text-lg font-bold text-zinc-900">Chưa có game hoạt động</p>
                <p className="mt-2 text-sm text-zinc-500">Hệ thống đang chờ dữ liệu thật từ API.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {filteredGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/recharge/${game.gamecode}`}
                    className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={game.thumbnail || createGameImage(game)}
                        alt={game.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-gradient-to-r from-rose-500 to-red-500 px-3 py-1.5 text-[11px] font-black uppercase text-white shadow-lg shadow-rose-500/30">
                        HOT
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-black leading-5 text-zinc-950">{game.name}</h3>
                        <p className="mt-1 truncate text-[11px] font-extrabold uppercase tracking-wide text-zinc-400">
                          {game.publisher || "NPH chưa cập nhật"} • Tự động
                        </p>
                      </div>
                      <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition group-hover:from-cyan-300 group-hover:to-blue-500">
                        <Gem className="h-4 w-4" />
                        Nạp ngay
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <Clock className="h-7 w-7 text-[#374669]" />
            <h3 className="mt-4 text-sm font-extrabold text-zinc-950">Tự động 24/7</h3>
            <p className="mt-2 text-xs font-medium leading-6 text-zinc-500">
              Xử lý đơn nhanh và ổn định cho các dịch vụ nạp game phổ biến.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <ShieldCheck className="h-7 w-7 text-[#374669]" />
            <h3 className="mt-4 text-sm font-extrabold text-zinc-950">Bảo mật tốt</h3>
            <p className="mt-2 text-xs font-medium leading-6 text-zinc-500">
              Thông tin đơn hàng và tài khoản được giữ gọn trong luồng thanh toán.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <Percent className="h-7 w-7 text-[#374669]" />
            <h3 className="mt-4 text-sm font-extrabold text-zinc-950">Giá cạnh tranh</h3>
            <p className="mt-2 text-xs font-medium leading-6 text-zinc-500">
              Dễ theo dõi giá theo từng cấp khách hàng và từng gói nạp.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <Headphones className="h-7 w-7 text-[#374669]" />
            <h3 className="mt-4 text-sm font-extrabold text-zinc-950">Hỗ trợ nhanh</h3>
            <p className="mt-2 text-xs font-medium leading-6 text-zinc-500">
              Có kênh hỗ trợ để xử lý các đơn cần kiểm tra hoặc đối soát.
            </p>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[#374669]/20 bg-[#243049] py-8 text-center text-xs text-zinc-400">
        <p className="font-semibold text-zinc-300">
          © 2026 Shop Thịnh Sáng - Hệ thống nạp game tự động uy tín
        </p>
        <div className="mt-3 flex justify-center gap-4 text-[10px] font-semibold text-cyan-400">
          <Link href="/admin/login" className="hover:text-cyan-300">
            Cổng Admin
          </Link>
          <span>•</span>
          <Link href="/profile" className="hover:text-cyan-300">
            Nạp ví
          </Link>
          <span>•</span>
          <Link href="/history" className="hover:text-cyan-300">
            Lịch sử
          </Link>
        </div>
      </footer>
    </div>
  );
}
