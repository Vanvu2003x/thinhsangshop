"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { clientApi } from '../clientApi';
import { 
  User, 
  Wallet, 
  CreditCard, 
  Coins, 
  ArrowLeft, 
  Check, 
  Copy, 
  AlertTriangle,
  History,
  Send,
  ShieldCheck,
  Gamepad2,
  QrCode,
  ArrowRight,
  Download
} from 'lucide-react';
import Header from '../components/Header';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Transfer amount for ATM guide
  const [atmAmount, setAtmAmount] = useState<string>('100000');

  // Submit messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedField, setCopiedField] = useState<string>('');

  // VietQR loading state
  const [qrLoading, setQrLoading] = useState(true);

  // Recent Wallet Logs State
  const [walletLogs, setWalletLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [refreshLogsTrigger, setRefreshLogsTrigger] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = clientApi.checkAuth();
        if (!user) {
          router.push('/login');
          return;
        }
        const profile = await clientApi.getProfile();
        setUserProfile(profile);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  // Load User Wallet Logs
  useEffect(() => {
    async function loadLogs() {
      try {
        const user = clientApi.checkAuth();
        if (!user) return;
        
        const logsRes = await clientApi.getWalletLogs();
        if (logsRes && logsRes.data) {
          setWalletLogs(logsRes.data);
        } else if (Array.isArray(logsRes)) {
          setWalletLogs(logsRes);
        }
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setLoadingLogs(false);
      }
    }
    loadLogs();
  }, [refreshLogsTrigger]);

  // Trigger QR loading state when parameters change
  useEffect(() => {
    setQrLoading(true);
  }, [atmAmount]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedText(false);
      setCopiedField('');
    }, 1500);
  };

  const username = userProfile?.email ? userProfile.email.split('@')[0] : (userProfile?.id || 'user');
  const memoCode = `TSD ${username}`.toUpperCase();

  const handleAtmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const amountVal = Number(atmAmount);
    if (isNaN(amountVal) || amountVal < 10000) {
      setErrorMsg("Số tiền chuyển khoản tối thiểu là 10.000đ!");
      return;
    }

    setSubmitting(true);
    try {
      const desc = `Nạp ATM ${amountVal.toLocaleString()}đ với nội dung chuyển: ${memoCode}`;
      const res = await clientApi.submitWalletLog(amountVal, "ATM", desc);
      
      if (res.success) {
        setSuccessMsg("Đã gửi yêu cầu xác nhận nạp tiền thành công! Vui lòng chờ vài phút để hệ thống kiểm tra và cộng tiền.");
        setRefreshLogsTrigger(prev => prev + 1);
        // Reset amount
        setAtmAmount('100000');
      }
    } catch (err: any) {
      setErrorMsg("Có lỗi xảy ra khi gửi yêu cầu xác nhận.");
    } finally {
      setSubmitting(false);
    }
  };

  const PRESETS = [10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] text-zinc-800">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9] text-zinc-800 font-sans selection:bg-blue-600/30">
      {/* CSS Styles for Animated QR scanning line */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .qr-scanner-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #22d3ee, transparent);
          box-shadow: 0 0 8px #22d3ee, 0 0 15px #06b6d4;
          animation: scan 4s ease-in-out infinite;
          pointer-events: none;
          z-index: 10;
        }
      `}} />

      {/* Background neon glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Reusable Premium Responsive Navbar */}
      <Header />

      {/* Profile & Topup Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8 relative z-10">
        
        {/* Top Hero: Account Overview Banner Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#243049] to-[#374669] text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-cyan-300 text-xl font-black shadow-inner">
              {userProfile?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-lg tracking-tight leading-none text-zinc-100">{userProfile?.name}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/10 rounded-full text-[10px] font-bold text-cyan-300 border border-white/5 uppercase">
                  {userProfile?.level === 3 ? 'Đại Lý Cấp 3 (Plus)' :
                   userProfile?.level === 2 ? 'Cộng Tác Viên (Pro)' : 'Thành Viên (Basic)'}
                </span>
              </div>
              <p className="text-zinc-300/80 text-xs font-mono">{userProfile?.email}</p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto relative z-10">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 sm:text-right min-w-[200px]">
              <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider block">Số Dư Tài Khoản</span>
              <span className="font-mono font-black text-cyan-400 text-2xl tracking-tight">
                {Number(userProfile?.balance).toLocaleString('vi-VN')}đ
              </span>
            </div>

            <Link
              href="/account/don-hang"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-zinc-800 hover:bg-zinc-100 transition shadow-md w-full sm:w-auto cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4 text-purple-600" />
              Lịch Sử Mua Acc Game
            </Link>
          </div>
        </div>

        {/* Bottom Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Block: Combined Account Details, QR Code, and Confirmation Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Wallet className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-zinc-900 uppercase tracking-wider">
                    Nạp Tiền Ví Qua Ngân Hàng
                  </h3>
                  <p className="text-zinc-500 text-xs">
                    Vui lòng nạp tiền theo hướng dẫn chi tiết bên dưới.
                  </p>
                </div>
              </div>

              {/* Error/Success alerts */}
              {errorMsg && (
                <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3.5 text-xs font-semibold">
                  <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 animate-bounce" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3.5 text-xs font-semibold">
                  <Check className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Step 1: Input amount & Preset buttons */}
              <div className="space-y-3.5 bg-zinc-50/50 border border-zinc-100 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <label className="block text-zinc-855 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    Bước 1: Nhập số tiền bạn muốn nạp
                  </label>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">Tối thiểu 10.000đ</span>
                </div>
                
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-405 font-bold text-sm">đ</span>
                  <input 
                    type="number"
                    value={atmAmount}
                    onChange={(e) => setAtmAmount(e.target.value)}
                    placeholder="100000"
                    min="10000"
                    required
                    className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl pl-9 pr-4 py-3 text-base outline-none focus:border-blue-500 transition-all duration-200 font-mono font-bold shadow-sm"
                  />
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {PRESETS.map((p) => {
                    const isSelected = Number(atmAmount) === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAtmAmount(String(p))}
                        className={`py-2 px-1 border rounded-xl text-[10px] font-bold font-mono transition-all duration-200 active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-650 hover:border-zinc-300'
                        }`}
                      >
                        {p.toLocaleString('vi-VN')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Unified Bank Transfer details & QR Code */}
              <div className="space-y-3.5">
                <label className="block text-zinc-855 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  Bước 2: Thực hiện chuyển khoản (Quét QR hoặc nhập thủ công)
                </label>

                {/* Sub-grid: QR Terminal on Left, Credit Card on Right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* VietQR Scanning Terminal card (Left) */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#111827] border border-zinc-800/80 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 shadow-xl min-h-[260px] group text-white">
                    {/* Animated scanning laser line */}
                    {!qrLoading && <div className="qr-scanner-line"></div>}

                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 text-zinc-400 text-[8px] font-black tracking-widest uppercase font-sans flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-cyan-400" />
                      QUÉT MÃ QR NHANH
                    </div>

                    {/* QR Code Frame */}
                    <div className="bg-white p-2.5 rounded-xl border border-zinc-700 shadow-inner relative overflow-hidden w-40 h-40 flex items-center justify-center mt-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={`https://img.vietqr.io/image/MB-97042292026-compact2.png?amount=${atmAmount || 100000}&addInfo=${encodeURIComponent(memoCode)}&accountName=NGUYEN%20VAN%20THINH`} 
                        alt="VietQR Code" 
                        className={`w-36 h-36 object-contain transition-all duration-300 ${qrLoading ? 'opacity-30 blur-[2px]' : 'opacity-100 blur-0'}`}
                        onLoad={() => setQrLoading(false)}
                      />

                      {qrLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-widest">
                      Tự động điền số tiền & nội dung
                    </span>
                  </div>

                  {/* Luxury Credit Card details (Right) */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e1b4b] text-white rounded-2xl p-5 shadow-xl border border-zinc-800/80 flex flex-col justify-between min-h-[260px]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none"></div>
                    
                    {/* Floating copied badge */}
                    {copiedText && (
                      <span className="absolute top-4 right-4 bg-emerald-500/90 border border-emerald-400 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-sans uppercase shadow-md animate-bounce">
                        Đã chép {copiedField === 'bank_no' ? 'STK' : copiedField === 'memo' ? 'Nội dung' : 'Số tiền'}!
                      </span>
                    )}

                    {!copiedText && (
                      <div className="absolute top-4 right-4 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider font-sans uppercase">
                        MB BANK
                      </div>
                    )}

                    {/* Card chip */}
                    <div className="w-9 h-7 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-md mb-4 opacity-80 shadow-inner"></div>
                    
                    {/* Card number */}
                    <div className="space-y-1 mb-4">
                      <div className="text-[8px] text-zinc-400 font-sans tracking-widest uppercase">SỐ TÀI KHOẢN NHẬN</div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-black tracking-widest text-cyan-400 font-mono">9704 2292 026</span>
                        <button 
                          type="button"
                          onClick={() => handleCopy('97042292026', 'bank_no')} 
                          className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-zinc-300 hover:text-white transition cursor-pointer"
                          title="Sao chép số tài khoản"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card footer details */}
                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <div className="text-[8px] text-zinc-400 font-sans tracking-wider uppercase">CHỦ TÀI KHOẢN</div>
                        <div className="font-extrabold text-xs tracking-wide uppercase font-mono">NGUYEN VAN THINH</div>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <div className="text-[8px] text-zinc-400 font-sans tracking-wider uppercase">NỘI DUNG CHUYỂN</div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px] font-black tracking-wider font-mono">{memoCode}</span>
                          <button 
                            type="button"
                            onClick={() => handleCopy(memoCode, 'memo')} 
                            className="p-1 bg-white/10 hover:bg-white/20 active:scale-95 rounded text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Sao chép nội dung"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Step 3: Confirmation Form */}
              <form onSubmit={handleAtmSubmit} className="space-y-3.5 border-t border-zinc-100 pt-6">
                <div>
                  <label className="block text-zinc-855 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    Bước 3: Xác nhận giao dịch để được duyệt tiền
                  </label>
                  <p className="text-zinc-550 text-[10px] leading-relaxed mt-1">
                    Sau khi bạn đã hoàn thành chuyển khoản, vui lòng bấm nút xác nhận dưới đây để hệ thống gửi yêu cầu kiểm tra và cộng tiền tự động lên hệ thống.
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs transition-all duration-300 cursor-pointer uppercase shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting ? "Đang gửi yêu cầu..." : "Xác nhận đã chuyển khoản"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Block: Recent Wallet Logs Ledger */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4 min-h-[500px] flex flex-col">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-sm text-zinc-950 uppercase tracking-wide">
                  Lịch sử nạp tiền gần đây
                </h3>
              </div>
              
              {loadingLogs ? (
                <div className="flex-1 flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : walletLogs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-2xl">
                  Chưa có yêu cầu nạp tiền nào được tạo.
                </div>
              ) : (
                <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[460px] pr-1">
                  {walletLogs.slice(0, 6).map((log: any) => {
                    const dateStr = new Date(log.created_at || log.createdAt).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    });
                    
                    const status = log.status || 'pending';
                    let badgeClass = '';
                    let statusText = status;
                    
                    if (status === 'Thành Công' || status === 'success') {
                      badgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                      statusText = 'Thành công';
                    } else if (status === 'Đang Chờ' || status === 'pending' || status === 'wait' || status === 'Chờ duyệt') {
                      badgeClass = 'bg-amber-50 text-amber-600 border-amber-100';
                      statusText = 'Đang chờ';
                    } else if (status === 'Đã Hủy' || status === 'cancelled') {
                      badgeClass = 'bg-zinc-100 text-zinc-500 border-zinc-200';
                      statusText = 'Đã hủy';
                    } else {
                      badgeClass = 'bg-rose-50 text-rose-600 border-rose-100';
                      statusText = 'Thất bại';
                    }

                    return (
                      <div key={log.id} className="border border-zinc-100 hover:border-zinc-200 bg-zinc-50/30 p-3 rounded-2xl space-y-2 transition duration-200">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-zinc-400 font-mono">{dateStr}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badgeClass}`}>
                            {statusText}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-mono font-extrabold text-emerald-600">+{Number(log.amount).toLocaleString('vi-VN')}đ</span>
                          <span className="text-[10px] font-bold text-zinc-550">{log.type || 'ATM'}</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 font-medium truncate" title={log.description}>
                          {log.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Footer bar */}
      <footer className="w-full border-t border-[#374669]/20 bg-[#243049] py-8 text-center text-xs text-zinc-400">
        <p className="font-semibold text-zinc-300">
          © 2026 Thịnh Sáng Shop - Hệ thống nạp game tự động uy tín
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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] text-zinc-800">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
