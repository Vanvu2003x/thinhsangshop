"use client";

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import Header from './components/Header';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6f9] text-zinc-800 font-sans selection:bg-blue-600/30">
      <Header />
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative z-10">
        <div className="bg-white border border-zinc-150 p-10 sm:p-14 rounded-[2.5rem] shadow-xl max-w-lg w-full flex flex-col items-center">
          
          <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-8 relative">
            <AlertCircle className="w-10 h-10 animate-pulse" />
            <span className="absolute inset-0 rounded-2xl bg-blue-600/5 animate-ping"></span>
          </div>

          <h1 className="font-black text-6xl sm:text-7xl text-zinc-900 tracking-tight leading-none">
            404
          </h1>
          
          <h2 className="text-lg sm:text-xl font-extrabold text-blue-600 mt-4 tracking-wider uppercase">
            Không tìm thấy trang
          </h2>

          <p className="text-zinc-500 text-xs sm:text-sm mt-4 leading-relaxed max-w-sm font-medium">
            Đường liên kết bạn đang truy cập không tồn tại hoặc đã được thay đổi cấu trúc liên kết mới.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full mt-10">
            <Link 
              href="/" 
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 shadow-md shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full bg-[#243049] border-t border-[#374669]/20 py-8 text-center text-xs text-zinc-400 relative z-10">
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
