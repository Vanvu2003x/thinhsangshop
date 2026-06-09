"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientApi } from '../clientApi';
import { 
  History, 
  ArrowLeft, 
  Search, 
  ShoppingCart, 
  Clock, 
  Check, 
  X,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import Header from '../components/Header';

export default function HistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const user = clientApi.checkAuth();
      if (!user) {
        router.push('/login');
        return;
      }
      const list = await clientApi.getOrdersHistory();
      setOrders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredOrders = orders.filter(o => {
    const searchStr = `${o.id} ${o.game_name} ${o.package_name} ${o.status}`.toLowerCase();
    return searchStr.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6f9] text-zinc-800 font-sans selection:bg-blue-600/30">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Reusable Premium Responsive Navbar */}
      <Header />

      {/* Main content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6 relative z-10">
        
        {/* Filters / Search row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-zinc-150 p-4 rounded-2xl shadow-sm">
          <div>
            <h3 className="font-bold text-base text-zinc-800 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Lịch sử đơn nạp game
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5">Xem tất cả các đơn hàng nạp vật phẩm game của bạn.</p>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <button 
              onClick={loadHistory}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-bold rounded-xl text-xs transition uppercase tracking-wider whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </button>
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Tìm theo mã đơn, tên game..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white pl-9 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 outline-none focus:border-blue-500 transition text-zinc-800 placeholder-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Table list */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-zinc-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold uppercase tracking-wider text-xs">
                    <th className="px-6 py-4">Mã đơn</th>
                    <th className="px-6 py-4">Tên Game & Gói nạp</th>
                    <th className="px-6 py-4">Thông tin nạp</th>
                    <th className="px-6 py-4">Thanh toán</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-400 text-sm">
                        Bạn chưa thực hiện bất kỳ giao dịch nạp game nào.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const accountStr = typeof order.account_info === 'object'
                        ? Object.entries(order.account_info).map(([k, v]) => `${k}: ${v}`).join(' | ')
                        : String(order.account_info);

                      return (
                        <tr key={order.id} className="hover:bg-zinc-50/50 transition duration-150">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-blue-600">#{order.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-zinc-900">{order.game_name}</div>
                            <div className="text-zinc-500 text-xs mt-0.5">{order.package_name}</div>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <div className="text-zinc-600 font-mono text-xs truncate" title={accountStr}>
                              {accountStr}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-zinc-850">
                            {Number(order.amount).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-6 py-4 text-zinc-500 text-xs">
                            {new Date(order.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              order.status === 'success' || order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              order.status === 'processing' || order.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              order.status === 'cancelled' || order.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {order.status === 'success' || order.status === 'COMPLETED' ? 'Thành công' :
                               order.status === 'processing' || order.status === 'PROCESSING' ? 'Đang nạp' :
                               order.status === 'cancelled' || order.status === 'failed' ? 'Đã hủy' : 'Chờ duyệt'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
