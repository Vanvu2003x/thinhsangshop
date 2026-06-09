"use client";

import React, { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';
import { ShoppingCart, Search, Check, X, Clock, AlertCircle, Eye } from 'lucide-react';

export default function OrderManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getOrders();
      setOrders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    const confirmMsg = status === 'success' 
      ? 'Xác nhận duyệt ĐƠN HÀNG THÀNH CÔNG?' 
      : 'Xác nhận HỦY ĐƠN HÀNG và tự động HOÀN TIỀN vào ví khách hàng?';
      
    if (confirm(confirmMsg)) {
      const res = await adminApi.updateOrderStatus(id, status);
      if (res.success) {
        loadOrders();
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(null);
        }
      }
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && (o.status === 'pending' || o.status === 'PENDING')) ||
      (statusFilter === 'processing' && (o.status === 'processing' || o.status === 'PROCESSING')) ||
      (statusFilter === 'success' && (o.status === 'success' || o.status === 'COMPLETED' || o.status === 'success')) ||
      (statusFilter === 'failed' && (o.status === 'failed' || o.status === 'cancelled' || o.status === 'FAILED'));

    const searchStr = `${o.id} ${o.user_name} ${o.user_email} ${o.game_name} ${o.package_name}`.toLowerCase();
    const matchesSearch = searchStr.includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1e293b]/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-lg">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { value: 'all', label: 'Tất cả đơn' },
            { value: 'pending', label: 'Chờ duyệt' },
            { value: 'processing', label: 'Đang nạp' },
            { value: 'success', label: 'Thành công' },
            { value: 'failed', label: 'Đã hủy/Thất bại' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                statusFilter === f.value 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm mã đơn, email khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f172a]/50 pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-purple-500 transition text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-400">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0f172a]/30 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Sản phẩm nạp</th>
                  <th className="px-6 py-4">Thông tin Game Account</th>
                  <th className="px-6 py-4">Thanh toán</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Duyệt nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-zinc-500">
                      Không tìm thấy đơn nạp nào khớp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    // Extract account details string
                    const accountStr = typeof order.account_info === 'object' 
                      ? Object.entries(order.account_info).map(([k, v]) => `${k}: ${v}`).join(' | ')
                      : String(order.account_info);

                    return (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition duration-150">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-purple-400">#{order.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{order.user_name}</div>
                          <div className="text-zinc-500 text-xs mt-0.5">{order.user_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{order.game_name}</div>
                          <div className="text-zinc-400 text-xs mt-0.5">{order.package_name}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-zinc-300 font-mono text-xs truncate" title={accountStr}>
                            {accountStr}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-white">
                          {Number(order.amount).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'success' || order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            order.status === 'processing' || order.status === 'PROCESSING' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            order.status === 'cancelled' || order.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {order.status === 'success' || order.status === 'COMPLETED' ? 'Thành công' :
                             order.status === 'processing' || order.status === 'PROCESSING' ? 'Đang nạp' :
                             order.status === 'cancelled' || order.status === 'failed' ? 'Đã hủy' : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-zinc-300 transition"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {(order.status === 'pending' || order.status === 'PENDING' || order.status === 'processing' || order.status === 'PROCESSING') && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'success')}
                                  className="p-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-emerald-400 transition"
                                  title="Duyệt thành công"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                  className="p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-rose-400 transition"
                                  title="Hủy & hoàn tiền"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/40 flex justify-between items-center">
              <h3 className="font-bold text-base text-white">Chi tiết Đơn hàng #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Game info header banner */}
              <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/10 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Trò chơi</p>
                  <h4 className="font-bold text-lg text-white mt-0.5">{selectedOrder.game_name}</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">{selectedOrder.package_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Thanh toán</p>
                  <h4 className="font-mono font-bold text-lg text-white mt-0.5">{Number(selectedOrder.amount).toLocaleString('vi-VN')}đ</h4>
                </div>
              </div>

              {/* Order specifications */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-white/5 pb-4">
                <div>
                  <span className="text-zinc-500 block text-xs">Mã đơn hàng</span>
                  <span className="text-zinc-200 font-mono font-semibold">#{selectedOrder.id}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs">Trạng thái hiện tại</span>
                  <span className="text-zinc-200 font-semibold uppercase text-xs">{selectedOrder.status}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs">Khách hàng</span>
                  <span className="text-zinc-200 font-semibold">{selectedOrder.user_name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs">Email liên lạc</span>
                  <span className="text-zinc-200 font-mono text-xs">{selectedOrder.user_email}</span>
                </div>
              </div>

              {/* Account Data details */}
              <div>
                <h4 className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-2.5">Thông tin tài khoản game nạp</h4>
                <div className="bg-[#0f172a]/50 border border-white/10 rounded-xl p-4 font-mono text-sm space-y-2">
                  {typeof selectedOrder.account_info === 'object' ? (
                    Object.entries(selectedOrder.account_info).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-zinc-500 uppercase text-xs">{key}</span>
                        <span className="text-zinc-200 font-bold">{String(val)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-200 break-all">{selectedOrder.account_info}</div>
                  )}
                </div>
              </div>

              {/* Modal footer action */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5 mt-6">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-semibold rounded-xl text-sm transition"
                >
                  Đóng lại
                </button>
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'PENDING' || selectedOrder.status === 'processing' || selectedOrder.status === 'PROCESSING') && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                      className="px-5 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl text-sm transition"
                    >
                      Hủy đơn & hoàn tiền
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'success')}
                      className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm transition"
                    >
                      Duyệt thành công
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
