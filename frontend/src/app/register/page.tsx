"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi } from '../clientApi';
import Link from 'next/link';
import { User, Mail, KeyRound, AlertTriangle, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await clientApi.register(name, email, password);
      if (res.success) {
        // Automatically login the user
        const loginRes = await clientApi.login(email, password);
        if (loginRes.success) {
          setSuccess(true);
          setTimeout(() => {
            window.location.href = '/';
          }, 1200);
        } else {
          router.push('/login');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6f9] text-zinc-800 font-sans selection:bg-blue-600/30">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white border border-zinc-150 p-8 sm:p-10 rounded-[2rem] shadow-xl">
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl mb-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="h-14 w-14 object-contain rounded-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight leading-tight uppercase">
                Đăng Ký Tài Khoản
              </h1>
              <p className="text-zinc-505 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed">
                Tạo tài khoản để nạp game giá rẻ và nhận ưu đãi đại lý
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3.5 text-xs mb-6 font-medium">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-3.5 text-xs mb-6 font-semibold">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Đăng ký thành công! Đang tự động đăng nhập...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-zinc-700 text-xs font-bold uppercase tracking-wider mb-2">
                  Họ và Tên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-white text-zinc-800 pl-11 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-300 text-sm font-medium placeholder-zinc-400 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 text-xs font-bold uppercase tracking-wider mb-2">
                  Địa Chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-white text-zinc-800 pl-11 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-300 text-sm font-medium placeholder-zinc-400 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 text-xs font-bold uppercase tracking-wider mb-2">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <KeyRound className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white text-zinc-800 pl-11 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-300 text-sm font-medium placeholder-zinc-400 shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition duration-300 transform active:scale-[0.98] text-sm mt-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Đang đăng ký...' : 'ĐĂNG KÝ TÀI KHOẢN'}
              </button>
            </form>

            <div className="border-t border-zinc-100 mt-8 pt-6 text-center text-xs text-zinc-500 font-medium">
              <p>Đã có tài khoản? <Link href="/login" className="text-blue-600 hover:text-blue-500 font-bold transition">Đăng nhập ngay</Link></p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer bar */}
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
