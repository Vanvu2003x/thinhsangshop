"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Globe, MessageCircle, PhoneCall } from "lucide-react";
import Header from "../components/Header";

export default function ContactPage() {
  const facebookUrl = "https://www.facebook.com/share/18FL77BKHA/?mibextid=wwXIfr";
  const zaloNumber = "0339793494";

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9] font-sans text-zinc-800">
      <Header />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="relative flex w-full max-w-lg flex-col items-center rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-xl sm:p-12">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
            <PhoneCall className="h-8 w-8" />
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-cyan-400" />
          </div>

          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-zinc-900 sm:text-3xl">
            Liên Hệ Hỗ Trợ
          </h1>
          <h2 className="mt-2 text-sm font-bold uppercase tracking-wider text-cyan-600">
            Thịnh Sáng Shop
          </h2>

          <p className="mt-4 max-w-sm text-xs font-medium leading-relaxed text-zinc-500 sm:text-sm">
            Nếu cần hỗ trợ nạp ví, xác nhận giao dịch hoặc xử lý đơn hàng, liên hệ trực tiếp qua Facebook hoặc Zalo.
          </p>

          <div className="mt-8 grid w-full gap-3">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-left transition hover:border-blue-300 hover:bg-blue-100/70"
            >
              <span className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-blue-600" />
                <span>
                  <span className="block text-xs font-black uppercase tracking-wider text-zinc-900">Facebook</span>
                  <span className="block text-[11px] text-zinc-500">Fanpage hỗ trợ</span>
                </span>
              </span>
              <span className="text-[11px] font-bold text-blue-600">Mở link</span>
            </a>

            <a
              href={`https://zalo.me/${zaloNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-cyan-100 bg-cyan-50 px-5 py-4 text-left transition hover:border-cyan-300 hover:bg-cyan-100/70"
            >
              <span className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-cyan-600" />
                <span>
                  <span className="block text-xs font-black uppercase tracking-wider text-zinc-900">Zalo</span>
                  <span className="block text-[11px] text-zinc-500">{zaloNumber}</span>
                </span>
              </span>
              <span className="text-[11px] font-bold text-cyan-600">Nhắn ngay</span>
            </a>
          </div>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/15 transition-all duration-300 hover:scale-[1.02] hover:bg-blue-500 active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-16 w-full border-t border-[#374669]/20 bg-[#243049] py-8 text-center text-xs text-zinc-400">
        <p className="font-semibold text-zinc-300">© 2026 Shop Thịnh Sáng - Hệ thống nạp game tự động uy tín</p>
        <div className="mt-3 flex justify-center gap-4 text-[10px] font-semibold text-cyan-400">
          <Link href="/admin/login" className="hover:text-cyan-300">
            Cổng Admin
          </Link>
          <span>•</span>
          <Link href="/profile" className="hover:text-cyan-300">
            Nạp Ví
          </Link>
          <span>•</span>
          <Link href="/history" className="hover:text-cyan-300">
            Lịch Sử
          </Link>
        </div>
      </footer>
    </div>
  );
}
