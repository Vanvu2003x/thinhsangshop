"use client";

import React, { useState, useEffect } from 'react';
import { adminApi } from './adminApi';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Gamepad2,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Percent,
  Wallet
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const [games, setGames] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletLogs, setWalletLogs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [gList, pList, oList, wList, cList] = await Promise.all([
          adminApi.getGames(),
          adminApi.getPackages(),
          adminApi.getOrders(),
          adminApi.getWalletLogs(),
          adminApi.getCustomers()
        ]);
        setGames(gList);
        setPackages(pList);
        setOrders(oList);
        setWalletLogs(wList);
        setCustomers(cList);
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
  const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'PENDING');
  const processingOrders = orders.filter((o: any) => o.status === 'processing' || o.status === 'PROCESSING');

  const totalRevenue = successOrders.reduce((sum, o: any) => sum + Number(o.amount), 0);
  
  // Estimate cost and profit based on mock logic (profit = 15% of revenue if not set)
  const totalProfit = successOrders.reduce((sum, o: any) => {
    const profitVal = o.profit !== undefined ? Number(o.profit) : Math.round(Number(o.amount) * 0.12);
    return sum + profitVal;
  }, 0);

  const totalCost = totalRevenue - totalProfit;

  const totalDeposits = walletLogs
    .filter((l: any) => l.status === 'Thành Công' || l.status === 'success')
    .reduce((sum, l: any) => sum + Number(l.amount), 0);

  // Custom Chart Data for Last 6 Months (Revenue vs Cost vs Profit)
  const chartData = [
    { month: 'Tháng 1', revenue: 4500000, cost: 3960000, profit: 540000 },
    { month: 'Tháng 2', revenue: 5800000, cost: 5104000, profit: 696000 },
    { month: 'Tháng 3', revenue: 8200000, cost: 7216000, profit: 984000 },
    { month: 'Tháng 4', revenue: 7100000, cost: 6248000, profit: 852000 },
    { month: 'Tháng 5', revenue: 9500000, cost: 8360000, profit: 1140000 },
    { month: 'Tháng 6', revenue: 12000000, cost: 10560000, profit: 1440000 },
  ];

  // Scale calculations for custom CSS bar chart
  const maxVal = Math.max(...chartData.map(d => d.revenue));

  const stats = [
    { name: 'Tổng Doanh Thu', value: `${totalRevenue.toLocaleString('vi-VN')}đ`, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { name: 'Tổng Lợi Nhuận', value: `${totalProfit.toLocaleString('vi-VN')}đ`, icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { name: 'Số Dư Khách Nạp', value: `${totalDeposits.toLocaleString('vi-VN')}đ`, icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Đơn Chờ Duyệt', value: pendingOrders.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { name: 'Khách Hàng', value: customers.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { name: 'Tổng số Game', value: games.length, icon: Gamepad2, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`bg-[#1e293b]/40 backdrop-blur-md border rounded-2xl p-5 flex items-center justify-between shadow-lg transition duration-300 hover:translate-y-[-2px] ${stat.bg}`}>
              <div>
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{stat.name}</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{stat.value}</h3>
              </div>
              <div className={`p-3.5 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Graph & Profit Margin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom CSS Chart Card */}
        <div className="lg:col-span-2 bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-zinc-100">Báo cáo Doanh số & Giá vốn</h3>
              <p className="text-zinc-400 text-xs mt-0.5">Biểu đồ so sánh 6 tháng gần nhất</p>
            </div>
            {/* Chart Legend */}
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-zinc-300">Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                <span className="text-zinc-300">Giá vốn</span>
              </div>
            </div>
          </div>

          {/* Graphical Bars */}
          <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-white/5 px-2">
            {chartData.map((d, index) => {
              const revPercent = (d.revenue / maxVal) * 100;
              const costPercent = (d.cost / maxVal) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full max-w-[64px]">
                    {/* Revenue Bar */}
                    <div 
                      style={{ height: `${revPercent}%` }} 
                      className="w-1/2 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-md relative group-hover:brightness-110 transition-all duration-500"
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#1e293b] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-purple-400 font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {(d.revenue / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    {/* Cost Bar */}
                    <div 
                      style={{ height: `${costPercent}%` }} 
                      className="w-1/2 bg-gradient-to-t from-[#ef4444] to-[#f87171] rounded-t-md relative group-hover:brightness-110 transition-all duration-500"
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#1e293b] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-red-400 font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {(d.cost / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                  <span className="text-zinc-500 text-xs mt-3 font-semibold">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Margin Card */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-100">Hiệu suất Doanh thu</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Biên độ lợi nhuận bình quân</p>
          </div>

          <div className="my-6 flex flex-col items-center justify-center flex-1">
            <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-8 border-purple-500/10 border-t-purple-500 border-r-cyan-400 animate-spin-slow">
              <div className="absolute flex flex-col items-center justify-center text-center rotate-0">
                <span className="text-3xl font-extrabold text-white">12.5%</span>
                <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-widest mt-1">Lợi nhuận ròng</span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 border-t border-white/5 pt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Giá vốn hàng nạp
              </span>
              <span className="text-zinc-200 font-bold">{(totalCost).toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Lợi nhuận gộp
              </span>
              <span className="text-cyan-400 font-bold">{(totalProfit).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders and Wallets list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Recharge Orders */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
              <ShoppingCart className="w-4.5 h-4.5 text-purple-400" />
              Đơn nạp game vừa tạo
            </h3>
            <Link href="/admin/orders" className="text-purple-400 hover:text-purple-300 text-xs font-semibold flex items-center gap-1">
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {orders.slice(0, 4).map((order: any, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">{order.game_name}</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">{order.package_name} - <span className="text-purple-400 font-medium">#{order.id}</span></p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">{Number(order.amount).toLocaleString('vi-VN')}đ</span>
                  <div className="mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'success' || order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      order.status === 'processing' || order.status === 'PROCESSING' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {order.status === 'success' || order.status === 'COMPLETED' ? 'Thành công' :
                       order.status === 'processing' || order.status === 'PROCESSING' ? 'Đang nạp' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Wallet Logs */}
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
              <Wallet className="w-4.5 h-4.5 text-cyan-400" />
              Đơn nạp ví mới nhận
            </h3>
            <Link href="/admin/wallet-logs" className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1">
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {walletLogs.slice(0, 4).map((log: any, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">{log.user_name}</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">{log.type} - {log.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-cyan-400">+{Number(log.amount).toLocaleString('vi-VN')}đ</span>
                  <div className="mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      log.status === 'Thành Công' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {log.status === 'Thành Công' ? 'Thành công' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
