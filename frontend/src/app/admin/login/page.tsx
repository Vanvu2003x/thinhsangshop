"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../adminApi';
import { KeyRound, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const user = adminApi.checkAuth();
    if (user && user.role === 'admin') {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const data = await adminApi.login(email, password);
      if (data && data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1200);
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại!');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-radial from-[#2e2b6b] via-[#182232] to-[#0d1520] p-4 text-white overflow-hidden">
      {/* Dynamic background glowing spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700"></div>

      <div className="w-full max-w-md relative">
        {/* Glow border outline */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        
        {/* Form Container */}
        <div className="relative bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-xl mb-4">
              <ShieldCheck className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Cổng Quản Trị Hệ Thống
            </h1>
            <p className="text-zinc-400 text-sm mt-2">Đăng nhập để quản lý game, gói nạp và doanh thu</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mb-6 animate-shake">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-3 text-sm mb-6 animate-pulse">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>Đăng nhập thành công! Đang vào trang quản trị...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Email Quản Trị
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@gmail.com"
                  className="w-full bg-[#0f172a]/50 pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition duration-300 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Mật Khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a]/50 pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition duration-300 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden group py-3.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transition duration-300 transform active:scale-[0.98] text-sm mt-2 disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
