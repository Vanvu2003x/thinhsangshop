"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  DollarSign,
  Percent,
  Receipt,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { adminApi } from "../adminApi";

type FinancePoint = {
  label: string;
  customer_deposit: number;
  customer_spent: number;
  cost: number;
  profit: number;
  margin_percent: number;
};

type FinanceSnapshot = {
  customer_deposit: number;
  customer_spent: number;
  wallet_balance?: number;
  cost: number;
  profit: number;
  margin_percent: number;
  success_order_count: number;
};

type RevenueDashboardData = {
  total: FinanceSnapshot;
  today: FinanceSnapshot;
  this_month: FinanceSnapshot;
  charts: {
    daily: FinancePoint[];
    monthly: FinancePoint[];
  };
};

const formatCurrency = (value: number) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const chartModes = [
  { key: "daily" as const, label: "Theo ngày" },
  { key: "monthly" as const, label: "Theo tháng" },
];

export default function RevenueManagement() {
  const [dashboard, setDashboard] = useState<RevenueDashboardData | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardResult, ordersResult] = await Promise.allSettled([
          adminApi.getRevenueDashboard(),
          adminApi.getOrders(),
        ]);

        setDashboard(dashboardResult.status === "fulfilled" ? dashboardResult.value : null);
        setOrders(ordersResult.status === "fulfilled" ? ordersResult.value : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading || !dashboard) {
    if (!loading && !dashboard) {
      return (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-5 text-sm text-rose-300 backdrop-blur-md">
          Không tải được dữ liệu doanh thu. Vui lòng kiểm tra lại kết nối API.
        </div>
      );
    }

    return (
      <div className="flex h-96 items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-xs text-zinc-500 font-medium">Đang tải dữ liệu doanh thu...</p>
        </div>
      </div>
    );
  }

  const total = dashboard.total;
  const today = dashboard.today;
  const month = dashboard.this_month;
  const chartData = chartMode === "daily" ? dashboard.charts.daily : dashboard.charts.monthly;
  const chartColumnMinWidth = chartMode === "daily" ? "min-w-[34px] sm:min-w-[40px]" : "min-w-[50px] sm:min-w-[58px]";
  const successOrders = orders.filter((order: any) => order.status === "success" || order.status === "COMPLETED");
  const maxChartValue = Math.max(
    1,
    ...chartData.flatMap((point) => [point.customer_deposit, point.customer_spent, point.profit])
  );

  const summaryCards = [
    {
      title: "Tổng khách tiêu",
      value: formatCurrency(total.customer_spent),
      sub: `${total.success_order_count} đơn hoàn thành`,
      icon: DollarSign,
      tone: "text-sky-400",
      glow: "shadow-[0_0_20px_-5px_rgba(14,165,233,0.12)]",
      border: "hover:border-sky-500/30",
      shell: "border-sky-500/20 bg-sky-500/10",
      accent: "from-sky-500/10 to-transparent",
    },
    {
      title: "Tổng lợi nhuận",
      value: formatCurrency(total.profit),
      sub: "Lợi nhuận thực tế thu về",
      icon: TrendingUp,
      tone: "text-emerald-400",
      glow: "shadow-[0_0_20px_-5px_rgba(16,185,129,0.12)]",
      border: "hover:border-emerald-500/30",
      shell: "border-emerald-500/20 bg-emerald-500/10",
      accent: "from-emerald-500/10 to-transparent",
    },
    {
      title: "Tổng giá vốn",
      value: formatCurrency(total.cost),
      sub: "Chi phí gốc nhập đơn",
      icon: Receipt,
      tone: "text-rose-400",
      glow: "shadow-[0_0_20px_-5px_rgba(244,63,94,0.12)]",
      border: "hover:border-rose-500/30",
      shell: "border-rose-500/20 bg-rose-500/10",
      accent: "from-rose-500/10 to-transparent",
    },
    {
      title: "Tổng nạp ví",
      value: formatCurrency(total.customer_deposit),
      sub: "Tiền nạp ví cộng dồn",
      icon: Wallet,
      tone: "text-amber-400",
      glow: "shadow-[0_0_20px_-5px_rgba(245,158,11,0.12)]",
      border: "hover:border-amber-500/30",
      shell: "border-amber-500/20 bg-amber-500/10",
      accent: "from-amber-500/10 to-transparent",
    },
    {
      title: "Tồn ví hiện tại",
      value: formatCurrency(total.wallet_balance || 0),
      sub: "Số dư khả dụng của khách",
      icon: Sparkles,
      tone: "text-fuchsia-400",
      glow: "shadow-[0_0_20px_-5px_rgba(217,70,239,0.12)]",
      border: "hover:border-fuchsia-500/30",
      shell: "border-fuchsia-500/20 bg-fuchsia-500/10",
      accent: "from-fuchsia-500/10 to-transparent",
    },
  ];

  const periodBlocks = [
    {
      title: "Hôm nay",
      data: today,
    },
    {
      title: "Tháng này",
      data: month,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Revenue Header Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1e293b]/80 via-[#0f172a]/95 to-[#0f172a]/90 p-5 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400 font-bold">Trung tâm Doanh thu</p>
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-white">
              Báo cáo Doanh thu & Dòng tiền
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-400">
              Hệ thống bóc tách rõ ràng: Tiền nạp ví (dòng tiền vào), Tiền khách tiêu (doanh số đơn hàng) và Lợi nhuận ròng thu về từ các đơn hoàn thành.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-3.5 lg:min-w-[280px] flex items-center gap-4 transition duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Biên lãi hệ thống</p>
              <p className="text-xl font-bold text-white mt-0.5">{total.margin_percent.toFixed(1)}%</p>
              <p className="text-[9px] text-zinc-500">Tính trên doanh số khách tiêu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111c2a]/40 p-4 transition-all duration-300 ${card.border} ${card.glow} hover:-translate-y-1 last:col-span-2 sm:last:col-span-2 lg:last:col-span-1`}
            >
              {/* Card glowing background */}
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.accent} blur-xl opacity-40 group-hover:opacity-60 transition duration-300 pointer-events-none`} />

              <div className="relative flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">{card.title}</p>
                  <p className="mt-2.5 break-words text-lg sm:text-2xl font-bold text-white tracking-tight">{card.value}</p>
                  <p className="mt-1.5 text-[10px] text-zinc-400 truncate">{card.sub}</p>
                </div>
                <div className={`rounded-xl border p-2 flex-shrink-0 transition-transform duration-300 group-hover:rotate-6 ${card.shell} ${card.tone}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Charts & Tables Workspace */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_0.9fr]">
        {/* Revenue Chart */}
        <div className="rounded-2xl border border-white/5 bg-[#111c2a]/20 p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Chu kỳ tài chính</p>
                <h2 className="mt-1 text-base font-bold text-white sm:text-lg">Biến động doanh thu & lợi nhuận</h2>
                <p className="text-xs text-zinc-500">
                  {chartMode === "daily" ? "Hiển thị 30 mốc ngày gần nhất" : "Hiển thị 6 mốc tháng gần nhất"}
                </p>
              </div>

              {/* Segmented Mode Selector */}
              <div className="flex rounded-lg border border-white/5 bg-white/[0.02] p-0.5">
                {chartModes.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setChartMode(mode.key)}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition duration-200 ${
                      chartMode === mode.key
                        ? "bg-cyan-500 text-slate-950 shadow-md bg-cyan-400"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Legends */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Khách nạp
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Khách tiêu
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Lợi nhuận
              </span>
            </div>
          </div>

          {/* Chart columns with horizontal grids */}
          <div className="relative mt-6 rounded-xl border border-white/5 bg-white/[0.01] p-3 pt-6 pb-2">
            {/* Gridlines */}
            <div className="absolute inset-x-0 top-6 bottom-[40px] flex flex-col justify-between pointer-events-none px-3">
              <div className="border-b border-white/[0.04] w-full h-0"></div>
              <div className="border-b border-white/[0.04] w-full h-0"></div>
              <div className="border-b border-white/[0.04] w-full h-0"></div>
              <div className="border-b border-white/[0.04] w-full h-0"></div>
            </div>

            {/* Chart Columns Wrapper */}
            <div className="relative z-10 flex h-[220px] items-end gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              {chartData.map((point) => {
                const depositHeight = (point.customer_deposit / maxChartValue) * 100;
                const spentHeight = (point.customer_spent / maxChartValue) * 100;
                const profitHeight = (point.profit / maxChartValue) * 100;

                return (
                  <div key={point.label} className={`group relative flex flex-1 flex-col items-center ${chartColumnMinWidth}`}>
                    {/* Hover Tooltip Card */}
                    <div className="absolute bottom-[108%] left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-xs text-left shadow-2xl opacity-0 scale-95 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-300 z-30 flex flex-col gap-1.5">
                      <p className="font-bold text-white border-b border-white/5 pb-1 mb-0.5 text-[11px] tracking-wider uppercase">{point.label}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400 font-medium">Khách nạp:</span>
                        <span className="font-bold text-white">{formatCurrency(point.customer_deposit)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sky-400 font-medium">Khách tiêu:</span>
                        <span className="font-bold text-white">{formatCurrency(point.customer_spent)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-medium">Lợi nhuận:</span>
                        <span className="font-bold text-white">{formatCurrency(point.profit)}</span>
                      </div>
                    </div>

                    {/* Chart Bars */}
                    <div className="flex h-[170px] w-full items-end justify-center gap-0.5 sm:gap-1 rounded-lg bg-white/[0.02] border border-white/[0.02] group-hover:bg-white/[0.04] px-0.5 pb-1 pt-2 transition duration-200">
                      <div className="relative h-full flex-1">
                        <div
                          style={{ height: `${Math.max(2, depositHeight)}%` }}
                          className="absolute bottom-0 w-full rounded-t-[3px] bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500 group-hover:brightness-110 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                        />
                      </div>
                      <div className="relative h-full flex-1">
                        <div
                          style={{ height: `${Math.max(2, spentHeight)}%` }}
                          className="absolute bottom-0 w-full rounded-t-[3px] bg-gradient-to-t from-sky-600 to-sky-400 transition-all duration-500 group-hover:brightness-110 shadow-[0_0_8px_rgba(14,165,233,0.15)]"
                        />
                      </div>
                      <div className="relative h-full flex-1">
                        <div
                          style={{ height: `${Math.max(2, profitHeight)}%` }}
                          className="absolute bottom-0 w-full rounded-t-[3px] bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 group-hover:brightness-110 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 transition duration-200">{point.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side: Period overview & checkpoints */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#111c2a]/20 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-zinc-200 border-b border-white/5 pb-3">
              <CalendarDays className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Tổng hợp kỳ</h3>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 xl:grid-cols-1">
              {periodBlocks.map((block) => (
                <div key={block.title} className="rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] p-3.5 transition duration-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">{block.title}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                      Lãi {block.data.margin_percent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Khách nạp</span>
                      <span className="font-bold text-amber-400">{formatCurrency(block.data.customer_deposit)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Khách tiêu</span>
                      <span className="font-bold text-sky-400">{formatCurrency(block.data.customer_spent)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Giá vốn</span>
                      <span className="font-bold text-rose-400">{formatCurrency(block.data.cost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Lợi nhuận</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(block.data.profit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#111c2a]/20 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-zinc-200 border-b border-white/5 pb-3">
              <BarChart3 className="h-4 w-4 text-fuchsia-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Danh sách mốc</h3>
            </div>

            <div className="mt-4 max-h-[280px] space-y-2.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/10">
              {[...chartData].reverse().map((point) => (
                <div key={point.label} className="rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] p-3 transition duration-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">{point.label}</p>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                      Lãi {point.margin_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-[10px] text-zinc-500">
                    <div>
                      <span className="block font-medium">Nạp ví</span>
                      <span className="block font-bold text-amber-400 mt-0.5">{formatCurrency(point.customer_deposit)}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Khách tiêu</span>
                      <span className="block font-bold text-sky-400 mt-0.5">{formatCurrency(point.customer_spent)}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Lợi nhuận</span>
                      <span className="block font-bold text-emerald-400 mt-0.5">{formatCurrency(point.profit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Profit Order Details Table */}
      <section className="rounded-2xl border border-white/5 bg-[#111c2a]/20 p-4 shadow-xl backdrop-blur-md">
        <div className="mb-4 border-b border-white/5 pb-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-200">
            <Receipt className="h-4 w-4 text-cyan-400" />
            Chi tiết đơn hàng tạo lợi nhuận
          </h3>
          <p className="mt-1 text-[11px] text-zinc-500">Thống kê các đơn thành công: Doanh thu bán ra trừ chi phí gốc nhập đơn.</p>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                <th className="px-4 py-3.5">Mã đơn</th>
                <th className="px-4 py-3.5">Game / Gói</th>
                <th className="px-4 py-3.5">Giá vốn</th>
                <th className="px-4 py-3.5">Giá bán</th>
                <th className="px-4 py-3.5">Lợi nhuận</th>
                <th className="px-4 py-3.5">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {successOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 font-medium">
                    Chưa có dữ liệu đơn hàng thành công nào.
                  </td>
                </tr>
              ) : (
                successOrders.map((order: any) => {
                  const profitValue = Number(order.profit || 0);
                  const costValue = Number(order.amount) - profitValue;

                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition duration-150">
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">#{order.id}</td>
                      <td className="px-4 py-3">
                        <span className="block font-bold text-white">{order.game_name}</span>
                        <span className="mt-0.5 block text-[10px] text-zinc-500 font-medium">{order.package_name}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-rose-400">{formatCurrency(costValue)}</td>
                      <td className="px-4 py-3 font-semibold text-sky-400">{formatCurrency(Number(order.amount))}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">{formatCurrency(profitValue)}</td>
                      <td className="px-4 py-3 text-zinc-500 font-medium">
                        {new Date(order.updated_at || order.created_at).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="space-y-3 lg:hidden">
          {successOrders.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-white/[0.01] px-4 py-8 text-center text-xs text-zinc-500 font-medium">
              Chưa có dữ liệu đơn hàng thành công nào.
            </div>
          ) : (
            successOrders.map((order: any) => {
              const profitValue = Number(order.profit || 0);
              const costValue = Number(order.amount) - profitValue;

              return (
                <div key={order.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-cyan-400">#{order.id}</p>
                      <p className="mt-2 font-bold text-white">{order.game_name}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-500 font-medium">{order.package_name}</p>
                    </div>
                    <div className="text-right text-[10px] text-zinc-500 font-medium">
                      {new Date(order.updated_at || order.created_at).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-2.5">
                    <div>
                      <span className="block text-zinc-500 text-[10px] font-medium">Giá vốn</span>
                      <span className="block font-semibold text-rose-400 mt-0.5">{formatCurrency(costValue)}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-500 text-[10px] font-medium">Giá bán</span>
                      <span className="block font-semibold text-sky-400 mt-0.5">{formatCurrency(Number(order.amount))}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-500 text-[10px] font-medium">Lợi nhuận</span>
                      <span className="block font-semibold text-emerald-400 mt-0.5">{formatCurrency(profitValue)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
