"use client";

import React, { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';
import { Users, Search, Edit, ShieldAlert, ShieldCheck, DollarSign, X } from 'lucide-react';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals / Edit state
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [name, setName] = useState('');
  const [level, setLevel] = useState(1);
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState('active');

  // Direct cash adjustment variables
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustType, setAdjustType] = useState('add'); // 'add' or 'subtract'

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getCustomers();
      setCustomers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setLevel(customer.level || 1);
    setBalance(customer.balance || 0);
    setStatus(customer.status || 'active');
    setAdjustAmount(0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    let finalBalance = Number(balance);
    if (adjustAmount > 0) {
      if (adjustType === 'add') {
        finalBalance += Number(adjustAmount);
      } else {
        finalBalance = Math.max(0, finalBalance - Number(adjustAmount));
      }
    }

    const updated = {
      ...editingCustomer,
      name,
      level: Number(level),
      balance: finalBalance,
      status
    };

    const res = await adminApi.updateCustomer(updated);
    if (res.success) {
      setEditingCustomer(null);
      loadCustomers();
    }
  };

  const handleToggleBan = async (customer: any) => {
    const isBanned = customer.status === 'banned';
    const confirmMsg = isBanned 
      ? `Xác nhận mở khóa tài khoản của ${customer.name}?` 
      : `Xác nhận KHÓA tài khoản của ${customer.name}? Khách hàng sẽ không thể đăng nhập.`;

    if (confirm(confirmMsg)) {
      const res = await adminApi.updateCustomer({
        ...customer,
        status: isBanned ? 'active' : 'banned'
      });
      if (res.success) {
        loadCustomers();
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    String(c?.name || "").toLowerCase().includes(search.toLowerCase()) || 
    String(c?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#1e293b]/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-lg">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo email, tên khách..."
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
        /* Customers List Table */
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0f172a]/30 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Cấp bậc ví (Level)</th>
                  <th className="px-6 py-4">Số dư ví khả dụng</th>
                  <th className="px-6 py-4">Ngày đăng ký</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-zinc-500">
                      Không tìm thấy khách hàng nào.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-white/[0.02] transition duration-150">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{customer.name}</div>
                        <div className="text-zinc-500 text-xs mt-0.5">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          customer.level === 3 ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          customer.level === 2 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {customer.level === 3 ? '⭐⭐⭐ Plus' :
                           customer.level === 2 ? '⭐⭐ Pro' : '⭐ Basic'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white text-sm">
                        {Number(customer.balance || 0).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-xs">
                        {new Date(customer.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          customer.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {customer.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleEdit(customer)}
                            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-zinc-300 transition"
                            title="Điều chỉnh số dư & thông tin"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleToggleBan(customer)}
                            className={`p-2 rounded-xl border transition ${
                              customer.status === 'banned' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                            }`}
                            title={customer.status === 'banned' ? 'Mở khóa' : 'Khóa tài khoản'}
                          >
                            {customer.status === 'banned' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/40 flex justify-between items-center">
              <h3 className="font-bold text-base text-white">Chỉnh sửa & Cộng/Trừ tiền</h3>
              <button onClick={() => setEditingCustomer(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Tên khách hàng</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Cấp bậc khách hàng</label>
                  <select 
                    value={level} 
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                  >
                    <option value={1}>⭐ Level 1 (Basic)</option>
                    <option value={2}>⭐⭐ Level 2 (Pro)</option>
                    <option value={3}>⭐⭐⭐ Level 3 (Plus)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Trạng thái hoạt động</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                  >
                    <option value="active">Active (Bình thường)</option>
                    <option value="banned">Banned (Bị khóa)</option>
                  </select>
                </div>
              </div>

              {/* Adjust Balance Panel */}
              <div className="border-t border-white/5 my-4 pt-4">
                <h4 className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  Điều chỉnh số dư ví (Hiện tại: {Number(balance).toLocaleString('vi-VN')}đ)
                </h4>

                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-1">
                    <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Hình thức</label>
                    <select 
                      value={adjustType} 
                      onChange={(e) => setAdjustType(e.target.value)}
                      className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                    >
                      <option value="add">Cộng tiền (+)</option>
                      <option value="subtract">Trừ tiền (-)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Số tiền điều chỉnh</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={adjustAmount} 
                        onChange={(e) => setAdjustAmount(Math.max(0, Number(e.target.value)))} 
                        min="0"
                        className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl pl-4 pr-9 py-2.5 text-sm outline-none focus:border-purple-500 transition font-mono font-bold"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-zinc-500 text-xs font-semibold">đ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingCustomer(null)}
                  className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-semibold rounded-xl text-sm transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm transition"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
