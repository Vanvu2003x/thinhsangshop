"use client";

import React from 'react';
import Link from 'next/link';
import { Wrench, ArrowLeft, HelpCircle } from 'lucide-react';
import Header from '../components/Header';

export default function PromotionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6f9] text-zinc-800 font-sans">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-[1400px] mx-auto w-full">
        <div className="relative bg-white border border-zinc-100 p-8 sm:p-12 rounded-[2rem] shadow-xl max-w-lg w-full flex flex-col items-center">
          {/* Blue blur glow in background */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 relative">
            <Wrench className="w-8 h-8 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></span>
          </div>

          <h1 className="font-extrabold text-2xl sm:text-3xl text-zinc-900 tracking-tight leading-tight uppercase">
            Đang Xây Dựng
          </h1>
          <h2 className="text-sm font-bold text-blue-600 mt-2 tracking-wider uppercase">
            Trang Khuyến Mãi
          </h2>

          <p className="text-zinc-500 text-xs sm:text-sm mt-4 leading-relaxed max-w-sm font-medium">
            Tính năng khuyến mãi đang được đội ngũ lập trình viên phát triển và tối ưu hóa hệ thống. Vui lòng quay lại sau!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-8">
            <Link 
              href="/" 
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-blue-500/15 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-16 w-full border-t border-[#374669]/20 bg-[#243049] py-8 text-center text-xs text-zinc-400">
        <p className="font-semibold text-zinc-300">© 2026 Thịnh Sáng Shop - Hệ thống nạp game tự động uy tín</p>
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
