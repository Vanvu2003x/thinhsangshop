"use client";

import React from 'react';
import { Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccManagerPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6">
      <div className="relative bg-[#1e293b]/40 backdrop-blur-md border border-white/5 p-8 sm:p-12 rounded-[2rem] shadow-xl max-w-lg w-full flex flex-col items-center">
        {/* Glow circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 relative">
          <Layers className="w-8 h-8 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-ping"></span>
        </div>

        <h1 className="font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight uppercase">
          Đang Xây Dựng
        </h1>
        <h2 className="text-sm font-bold text-purple-400 mt-2 tracking-wider uppercase">
          Tính năng sắp ra mắt
        </h2>

        <p className="text-zinc-400 text-xs sm:text-sm mt-4 leading-relaxed max-w-sm font-medium">
          Hệ thống quản lý kho tài khoản game đang được phát triển và tối ưu hóa dữ liệu. Vui lòng quay lại sau!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full mt-8">
          <Link 
            href="/admin" 
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-purple-500/15 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay Lại Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
