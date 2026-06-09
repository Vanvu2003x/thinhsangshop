"use client";

import React, { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';
import { TrendingUp, DollarSign, ArrowUpRight, BarChart3, Receipt, ShoppingCart, Percent } from 'lucide-react';

export default function RevenueManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [walletLogs, setWalletLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [oList, wList] = await Promise.all([
          adminApi.getOrders(),
          adminApi.getWalletLogs()
        ]);
        setOrders(oList);
        setWalletLogs(wList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate statistics
  const successOrders = orders.filter((o: any) => o.status === 'success' || o.status === 'COMPLETED');
  
  const totalRevenue = successOrders.reduce((sum, o: any) => sum + Number(o.amount), 0);
  const totalProfit = successOrders.reduce((sum, o: any) => {
    return sum + (o.profit !== undefined ? Number(o.profit) : Math.round(Number(o.amount) * 0.12));
  }, 0);
  const totalCost = totalRevenue - totalProfit;
  
  const totalDeposits = walletLogs
    .filter((l: any) => l.status === 'Thành Công' || l.status === 'success')
    .reduce((sum, l: any) => sum + Number(l.amount), 0);

  // Profit margin
  const marginPercent = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Monthly comparison mock data
  const monthlyStats = [
    { month: 'Tháng 1', revenue: 4500000, profit: 540000, cost: 3960000, margin: '12.0%' },
    { month: 'Tháng 2', revenue: 5800000, profit: 696000, cost: 5104000, margin: '12.0%' },
    { month: 'Tháng 3', revenue: 8200000, profit: 984000, cost: 7216000, margin: '12.0%' },
    { month: 'Tháng 4', revenue: 7100000, profit: 852000, cost: 6248000, margin: '12.0%' },
    { month: 'Tháng 5', revenue: 9500000, profit: 1140000, cost: 8360000, margin: '12.0%' },
    { month: 'Tháng 6', revenue: 12000000, profit: 1440000, cost: 10560000, margin: '12.0%' }
  ];

  const maxRevenue = Math.max(...monthlyStats.map(d => d.revenue));

  return (
    <div className="space-y-6">
      {/* Top summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-purple-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Tổng Doanh Số</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalRevenue.toLocaleString('vi-VN')}đ</h3>
            <p className="text-zinc-500 text-xs mt-1">Từ {successOrders.length} đơn hoàn thành</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Lợi Nhuận Ròng</p>
            <h3 className="text-2xl font-bold text-cyan-400 mt-1">{totalProfit.toLocaleString('vi-VN')}đ</h3>
            <p className="text-zinc-500 text-xs mt-1">Lãi ròng thu về ví</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-rose-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Tổng Giá Vốn (Chi phí)</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">{totalCost.toLocaleString('vi-VN')}đ</h3>
            <p className="text-zinc-500 text-xs mt-1">Chi trả cho API Partner</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Biên Lãi</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">~{marginPercent}%</h3>
            <p className="text-zinc-500 text-xs mt-1">Hiệu suất trung bình</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Graph & Monthly table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphical Performance */}
        <div className="lg:col-span-2 bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-base text-zinc-100">Xu Hướng Doanh Thu & Lợi Nhuận</h3>
              <p className="text-zinc-400 text-xs mt-0.5">Biểu đồ biểu thị tăng trưởng qua các tháng</p>
            </div>
            {/* Color keys */}
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-zinc-300">Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="text-zinc-300">Lợi nhuận</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-white/5 px-2">
            {monthlyStats.map((d, index) => {
              const revPercent = (d.revenue / maxRevenue) * 100;
              const profitPercent = ((d.profit * 6) / maxRevenue) * 100; // Multiplied for visual height comparison

              return (
                <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full max-w-[64px]">
                    <div 
                      style={{ height: `${revPercent}%` }} 
                      className="w-1/2 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-md relative group-hover:brightness-110 transition-all duration-500"
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#1e293b] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-purple-400 font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {(d.revenue / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div 
                      style={{ height: `${profitPercent}%` }} 
                      className="w-1/2 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-md relative group-hover:brightness-110 transition-all duration-500"
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#1e293b] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-cyan-400 font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {(d.profit / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>
                  <span className="text-zinc-500 text-xs mt-3 font-semibold">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2 mb-4">
              <BarChart3 className="w-4.5 h-4.5 text-cyan-400" />
              Chi tiết doanh số theo tháng
            </h3>
          </div>

          <div className="divide-y divide-white/5 flex-1 overflow-y-auto max-h-64 pr-1">
            {monthlyStats.reverse().map((d, index) => (
              <div key={index} className="py-2.5 flex justify-between text-xs first:pt-0 last:pb-0">
                <div>
                  <span className="text-zinc-200 font-semibold">{d.month}</span>
                  <div className="text-zinc-500 text-[10px] mt-0.5">Biên độ: {d.margin}</div>
                </div>
                <div className="text-right">
                  <span className="text-zinc-200 font-bold block">+{d.revenue.toLocaleString('vi-VN')}đ</span>
                  <span className="text-cyan-400 text-[10px] font-semibold">Lãi: +{d.profit.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Cost Breakdown Table */}
      <div className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
        <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2 mb-4">
          <Receipt className="w-4.5 h-4.5 text-purple-400" />
          Chi tiết doanh thu giao dịch đơn nạp
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Tên Game & Gói nạp</th>
                <th className="px-4 py-3">Giá gốc nhập (Cost)</th>
                <th className="px-4 py-3">Giá bán ra (Revenue)</th>
                <th className="px-4 py-3">Lợi nhuận (Profit)</th>
                <th className="px-4 py-3">Ngày nạp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {successOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-zinc-500">
                    Chưa có giao dịch thành công nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                successOrders.map((o: any) => {
                  const profitVal = o.profit !== undefined ? Number(o.profit) : Math.round(Number(o.amount) * 0.12);
                  const costVal = Number(o.amount) - profitVal;
                  return (
                    <tr key={o.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-3 font-mono text-purple-400 font-bold">#{o.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white block">{o.game_name}</span>
                        <span className="text-zinc-500 text-[10px]">{o.package_name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-400 font-semibold">{costVal.toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3 font-mono text-white font-bold">{Number(o.amount).toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 font-bold">+{profitVal.toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(o.created_at || o.create_at).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
