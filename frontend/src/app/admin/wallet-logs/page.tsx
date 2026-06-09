"use client";

import React, { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';
import { Wallet, Search, Check, X, CreditCard, DollarSign } from 'lucide-react';

export default function WalletLogManagement() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getWalletLogs();
      setLogs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleProcessLog = async (id: string, approve: boolean) => {
    const action = approve ? 'DUYỆT NẠP TIỀN' : 'HỦY YÊU CẦU NẠP';
    if (confirm(`Xác nhận thực hiện ${action} này?`)) {
      const res = await adminApi.approveWalletLog(id, approve);
      if (res.success) {
        loadLogs();
      }
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && l.status === 'pending') ||
      (statusFilter === 'success' && l.status === 'Thành Công') ||
      (statusFilter === 'failed' && l.status === 'Đã Hủy');

    const searchStr = `${l.id} ${l.user_name} ${l.user_email} ${l.description} ${l.type}`.toLowerCase();
    const matchesSearch = searchStr.includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Action Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1e293b]/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-lg">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { value: 'all', label: 'Tất cả yêu cầu' },
            { value: 'pending', label: 'Chờ duyệt' },
            { value: 'success', label: 'Thành công' },
            { value: 'failed', label: 'Đã hủy' }
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
            placeholder="Tìm theo email, tên, id..."
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
        /* Logs Table List */
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0f172a]/30 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">Mã nạp</th>
                  <th className="px-6 py-4">Tên khách hàng</th>
                  <th className="px-6 py-4">Hình thức / Mô tả</th>
                  <th className="px-6 py-4">Mệnh giá nạp</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Phê duyệt nạp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-zinc-500">
                      Không có yêu cầu nạp ví nào.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition duration-150">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-cyan-400">{log.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{log.user_name}</div>
                        <div className="text-zinc-500 text-xs mt-0.5">{log.user_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-zinc-400" />
                          <span className="text-zinc-300 font-medium">{log.type}</span>
                        </div>
                        <div className="text-zinc-500 text-xs mt-0.5 font-light">{log.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white text-sm">
                          +{Number(log.amount).toLocaleString('vi-VN')}đ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.status === 'Thành Công' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.status === 'Đã Hủy' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {log.status === 'Thành Công' ? 'Thành công' :
                           log.status === 'Đã Hủy' ? 'Đã hủy' : 'Chờ duyệt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {log.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleProcessLog(log.id, true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold transition"
                                title="Phê duyệt"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleProcessLog(log.id, false)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition"
                                title="Từ chối"
                              >
                                <X className="w-3.5 h-3.5" />
                                Hủy
                              </button>
                            </>
                          )}
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
    </div>
  );
}
