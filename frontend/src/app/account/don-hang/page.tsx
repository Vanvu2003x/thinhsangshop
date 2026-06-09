"use client";

import React from 'react';
import Link from 'next/link';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import Header from '../../components/Header';

export default function MyAccountOrdersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9] font-sans text-zinc-800 selection:bg-blue-600/30">
      <Header />

      <main className="mx-auto w-full max-w-[1000px] px-4 sm:px-6 relative z-20 mt-8 mb-12 flex-1 flex flex-col items-center justify-center">
        <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 sm:p-12 shadow-sm max-w-lg w-full flex flex-col items-center text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6 relative">
            <Gamepad2 className="w-8 h-8 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-ping"></span>
          </div>

          <h1 className="font-extrabold text-2xl sm:text-3xl text-zinc-950 tracking-tight leading-tight uppercase">
            Đang Xây Dựng
          </h1>
          <h2 className="text-sm font-bold text-purple-600 mt-2 tracking-wider uppercase">
            Tính Năng Sắp Ra Mắt
          </h2>

          <p className="text-zinc-505 text-xs sm:text-sm mt-4 leading-relaxed max-w-sm font-medium">
            Khu vực xem lịch sử giao dịch mua tài khoản game đang được tích hợp. Cảm ơn bạn đã kiên nhẫn chờ đợi!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-8">
            <Link 
              href="/" 
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full border-t border-[#374669]/20 bg-[#243049] py-8 text-center text-xs text-zinc-400">
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
