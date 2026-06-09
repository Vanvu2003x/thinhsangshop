"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientApi } from '../../clientApi';
import { resolvePackageThumbnail } from '../../packageArt';
import { 
  Gamepad2, 
  ArrowLeft, 
  User, 
  Coins, 
  CreditCard, 
  Check, 
  Sparkles, 
  AlertTriangle,
  HelpCircle,
  History
} from 'lucide-react';
import Header from '../../components/Header';

export default function GameRechargePage({ params }: { params: Promise<{ gamecode: string }> }) {
  const router = useRouter();
  
  // Unwrap dynamic params in Next.js 16
  const { gamecode } = React.use(params);

  const [game, setGame] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Form selections
  const [accountData, setAccountData] = useState<any>({});
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet'); // 'wallet', 'atm', 'card'
  
  const checkoutColRef = useRef<HTMLDivElement>(null);

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPkgId(pkgId);
    setTimeout(() => {
      checkoutColRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  // Submit messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadRechargeData() {
      try {
        const gamesList = await clientApi.getGames();
        const foundGame = gamesList.find((g: any) => g.gamecode === gamecode);
        if (!foundGame) {
          router.push('/');
          return;
        }
        setGame(foundGame);

        const pkgsList = await clientApi.getPackagesByGameId(foundGame.id);
        setPackages(pkgsList.filter((p: any) => p.status === 'active'));
        if (pkgsList.length > 0) {
          setSelectedPkgId(pkgsList[0].id);
        }

        const user = clientApi.checkAuth();
        if (user) {
          const profile = await clientApi.getProfile();
          setUserProfile(profile);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRechargeData();
  }, [gamecode, router]);

  const handleInputChange = (fieldName: string, value: string) => {
    setAccountData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Check auth
    if (!userProfile) {
      setErrorMsg("Vui lòng đăng nhập để thanh toán đơn hàng!");
      return;
    }

    // Verify fields
    const fields = game.input_fields || [];
    for (const f of fields) {
      if (f.required && !accountData[f.name]) {
        setErrorMsg(`Vui lòng điền thông tin: ${f.label}`);
        return;
      }
    }

    if (!selectedPkgId) {
      setErrorMsg("Vui lòng chọn gói nạp cần mua!");
      return;
    }

    const selectedPkg = packages.find(p => p.id === selectedPkgId);
    if (!selectedPkg) return;

    // Price calculation depending on user level
    let packageCost = selectedPkg.price_basic || selectedPkg.price;
    if (userProfile.level === 2) packageCost = selectedPkg.price_pro || Math.round(packageCost * 0.96);
    if (userProfile.level === 3) packageCost = selectedPkg.price_plus || Math.round(packageCost * 0.92);

    const totalCost = packageCost * quantity;

    if (paymentMethod === 'wallet') {
      if (Number(userProfile.balance) < totalCost) {
        setErrorMsg("Số dư ví không đủ! Vui lòng nạp thêm tiền ví hoặc chọn phương thức khác.");
        return;
      }
    } else {
      router.push('/profile');
      return;
    }

    setSubmitting(true);
    try {
      let success = true;
      let lastMessage = "";

      if (quantity > 1) {
        for (let i = 0; i < quantity; i++) {
          const res = await clientApi.createOrder(selectedPkgId, 1, accountData);
          if (!res.success) {
            success = false;
            lastMessage = res.message || `Tạo đơn thứ ${i + 1} thất bại.`;
            break;
          }
        }
      } else {
        const res = await clientApi.createOrder(selectedPkgId, 1, accountData);
        if (!res.success) {
          success = false;
          lastMessage = res.message || "Tạo đơn thất bại.";
        }
      }

      if (success) {
        setSuccessMsg(quantity > 1 ? `Tạo ${quantity} đơn hàng nạp thành công! Hệ thống đang xử lý.` : "Tạo đơn hàng nạp thành công! Hệ thống đang tự động xử lý đơn.");
        // Reload profile to reflect new balance
        const freshProfile = await clientApi.getProfile();
        setUserProfile(freshProfile);
        setTimeout(() => {
          router.push('/history');
        }, 1500);
      } else {
        setErrorMsg(lastMessage || "Tạo đơn thất bại.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Giao dịch lỗi. Vui lòng liên hệ hỗ trợ.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] text-zinc-800">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const fields = game?.input_fields || [];
  const selectedPkg = packages.find(p => p.id === selectedPkgId);

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9] text-zinc-800 font-sans selection:bg-blue-600/30">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Reusable Premium Responsive Navbar */}
      <Header />

      {/* Main content grid */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Forms Col (Step 1 and Step 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Game Banner Header CARD */}
          <div className="bg-white border border-zinc-150 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-16 h-16 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={game?.thumbnail} alt={game?.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-zinc-900">{game?.name}</h2>
              <p className="text-zinc-500 text-xs mt-0.5 uppercase tracking-widest font-semibold font-mono">MÃ GAME: {game?.gamecode}</p>
            </div>
          </div>

          {/* STEP 1: ACCOUNT INFO CARD */}
          <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">1</span>
              <h3 className="font-bold text-sm text-zinc-800 uppercase tracking-wider">Thông tin tài khoản nhận game</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f: any) => (
                <div key={f.name}>
                  <label className="block text-zinc-600 text-xs font-semibold uppercase tracking-wider mb-2">{f.label}</label>
                  <input 
                    type={f.type || 'text'}
                    value={accountData[f.name] || ''}
                    onChange={(e) => handleInputChange(f.name, e.target.value)}
                    placeholder={`Nhập ${f.label}`}
                    required={f.required}
                    className="w-full bg-white border border-zinc-200 text-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2: SELECT PACKAGE CARD */}
          <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">2</span>
              <h3 className="font-bold text-sm text-zinc-800 uppercase tracking-wider">Chọn gói vật phẩm cần nạp</h3>
            </div>

            {packages.length === 0 ? (
              <p className="text-zinc-500 text-xs py-4 text-center">Trò chơi này hiện chưa có gói nạp nào hoạt động.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {packages.map((pkg) => {
                  const isSelected = selectedPkgId === pkg.id;
                  
                  // Compute price based on level
                  let displayPrice = pkg.price_basic || pkg.price;
                  if (userProfile?.level === 2) displayPrice = pkg.price_pro || Math.round(displayPrice * 0.96);
                  if (userProfile?.level === 3) displayPrice = pkg.price_plus || Math.round(displayPrice * 0.92);

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleSelectPackage(pkg.id)}
                      className={`relative flex flex-col justify-between border rounded-xl p-3 text-left transition-all duration-200 shadow-sm cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50/50 border-blue-500 text-zinc-900 ring-1 ring-blue-500' 
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 text-zinc-700'
                      }`}
                    >
                      {/* Package check dot */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                          <Check className="w-2 h-2" />
                        </div>
                      )}

                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-150 overflow-hidden mb-2 p-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolvePackageThumbnail(game, pkg)}
                          alt={pkg.package_name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div>
                        <div className="text-[11px] font-bold leading-tight line-clamp-2 h-7 text-zinc-800">{pkg.package_name}</div>
                        <div className="text-xs font-mono font-bold text-blue-600 mt-1">{Number(displayPrice).toLocaleString('vi-VN')}đ</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Checkout Col (Step 3 and Order Summary) */}
        <div className="space-y-6">
          {/* STEP 3: PAYMENT METHOD */}
          <div ref={checkoutColRef} className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">3</span>
              <h3 className="font-bold text-sm text-zinc-800 uppercase tracking-wider">Phương thức thanh toán</h3>
            </div>

            <div className="space-y-3">
              {/* Wallet Balance Payment */}
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`w-full flex items-center justify-between p-4 border rounded-2xl text-left transition-all cursor-pointer ${
                  paymentMethod === 'wallet' 
                    ? 'bg-blue-50/50 border-blue-500 text-zinc-900 ring-1 ring-blue-500' 
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="text-xs font-bold block text-zinc-800">Số dư ví (Shop Thịnh Sáng)</span>
                    <span className="text-[10px] text-zinc-400 font-medium">Khuyên dùng, xử lý ngay lập tức</span>
                  </div>
                </div>
                {userProfile && (
                  <span className="text-xs font-mono font-bold text-zinc-600">{Number(userProfile.balance).toLocaleString('vi-VN')}đ</span>
                )}
              </button>

              {/* ATM Bank Transfer (Locked) */}
              <div
                className="w-full flex items-center justify-between p-4 border border-zinc-200 bg-zinc-50 text-zinc-400 rounded-2xl text-left cursor-not-allowed relative overflow-hidden"
                title="Phương thức chuyển khoản ATM trực tiếp đang tạm khóa. Vui lòng nạp tiền vào ví ở trang Cá nhân."
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-zinc-300" />
                  <div>
                    <span className="text-xs font-bold block text-zinc-400 flex items-center gap-1.5">
                      Chuyển khoản ATM
                      <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-500 text-[8px] font-extrabold uppercase tracking-wider">Tạm khóa</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">Vui lòng nạp ví ở trang cá nhân để thanh toán</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ORDER SUMMARY CHECKOUT */}
          <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-3">Chi tiết đơn hàng</h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Trò chơi</span>
                <span className="text-zinc-800 font-semibold">{game?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Vật phẩm</span>
                <span className="text-zinc-800 font-semibold">{selectedPkg ? selectedPkg.package_name : 'Chưa chọn'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Số lượng</span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-5 h-5 bg-zinc-50 border border-zinc-200 flex items-center justify-center rounded text-zinc-700 font-bold hover:bg-zinc-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-zinc-800 w-4 text-center">{quantity}</span>
                  <button 
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-5 h-5 bg-zinc-50 border border-zinc-200 flex items-center justify-center rounded text-zinc-700 font-bold hover:bg-zinc-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="border-t border-zinc-100 pt-3 flex justify-between items-end">
                <span className="text-zinc-500 font-semibold">TỔNG THANH TOÁN</span>
                <span className="text-lg font-mono font-bold text-blue-600">
                  {selectedPkg ? (
                    (() => {
                      let packagePrice = selectedPkg.price_basic || selectedPkg.price;
                      if (userProfile?.level === 2) packagePrice = selectedPkg.price_pro || Math.round(packagePrice * 0.96);
                      if (userProfile?.level === 3) packagePrice = selectedPkg.price_plus || Math.round(packagePrice * 0.92);
                      return (packagePrice * quantity).toLocaleString('vi-VN');
                    })()
                  ) : 0}đ
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="flex flex-col gap-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {errorMsg.includes("Số dư ví không đủ") && (
                  <Link 
                    href="/profile" 
                    className="mt-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition text-[10px] uppercase tracking-wider self-start"
                  >
                    Nạp ví ngay tại đây
                  </Link>
                )}
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3 text-xs font-semibold">
                <Check className="w-4 h-4 flex-shrink-0 animate-bounce" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              onClick={handleRechargeSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-md shadow-blue-500/10 transition transform active:scale-98 disabled:opacity-50 text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              {submitting ? 'Đang xử lý giao dịch...' : (paymentMethod === 'wallet' ? 'Thanh Toán Ngay' : 'Nạp Tiền Vào Ví')}
            </button>
          </div>
        </div>
      </main>

      {/* Footer bar */}
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
