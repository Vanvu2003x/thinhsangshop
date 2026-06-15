"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  DollarSign,
  Gamepad2,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Activity,
  ArrowRight
} from "lucide-react";
import { adminApi } from "./adminApi";

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

export default function DashboardOverview() {
  const [games, setGames] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletLogs, setWalletLogs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<RevenueDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    async function loadData() {
      try {
        const [gamesResult, packagesResult, ordersResult, walletLogsResult, customersResult, dashboardResult] = await Promise.allSettled([
          adminApi.getGames(),
          adminApi.getPackages(),
          adminApi.getOrders(),
          adminApi.getWalletLogs(),
          adminApi.getCustomers(),
          adminApi.getRevenueDashboard(),
        ]);

        setGames(gamesResult.status === "fulfilled" ? gamesResult.value : []);
        setPackages(packagesResult.status === "fulfilled" ? packagesResult.value : []);
        setOrders(ordersResult.status === "fulfilled" ? ordersResult.value : []);
        setWalletLogs(walletLogsResult.status === "fulfilled" ? walletLogsResult.value : []);
        setCustomers(customersResult.status === "fulfilled" ? customersResult.value : []);
        setDashboard(dashboardResult.status === "fulfilled" ? dashboardResult.value : null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Status Badge Renderer helper
  const renderStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "thành công" || s === "success" || s === "completed" || s === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.08)]">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
          Thành công
        </span>
      );
    }
    if (s === "đang chờ" || s === "pending" || s === "processing") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.08)]">
          <span className="w-1.2 h-1.2 rounded-full bg-amber-400 animate-pulse"></span>
          Đang chờ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 text-[10px] font-bold text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.08)]">
        <span className="w-1 h-1 rounded-full bg-rose-400"></span>
        {status || "Đã hủy"}
      </span>
    );
  };

  if (loading || !dashboard) {
    if (!loading && !dashboard) {
      return (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-5 text-sm text-rose-300 backdrop-blur-md">
          Không tải được dữ liệu dashboard tài chính. Vui lòng kiểm tra lại kết nối API.
        </div>
      );
    }

    return (
      <div className="flex h-96 items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-xs text-zinc-500 font-medium">Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  const total = dashboard.total;
  const today = dashboard.today;
  const month = dashboard.this_month;
  const chartData = chartMode === "daily" ? dashboard.charts.daily : dashboard.charts.monthly;
  const chartColumnMinWidth = chartMode === "daily" ? "min-w-[34px] sm:min-w-[40px]" : "min-w-[50px] sm:min-w-[58px]";
  const maxChartValue = Math.max(
    1,
    ...chartData.flatMap((point) => [point.customer_deposit, point.customer_spent, point.profit])
  );

  const topCards = [
    {
      name: "Tổng nạp ví",
      value: formatCurrency(total.customer_deposit),
      note: "Tổng tiền khách nạp thành công",
      icon: Wallet,
      glow: "shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]",
      border: "hover:border-amber-500/30",
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      accent: "from-amber-500/10 to-transparent",
    },
    {
      name: "Tổng khách tiêu",
      value: formatCurrency(total.customer_spent),
      note: `${total.success_order_count} đơn hàng hoàn tất`,
      icon: DollarSign,
      glow: "shadow-[0_0_20px_-5px_rgba(14,165,233,0.15)]",
      border: "hover:border-sky-500/30",
      iconColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      accent: "from-sky-500/10 to-transparent",
    },
    {
      name: "Số dư ví hiện tại",
      value: formatCurrency(total.wallet_balance || 0),
      note: "Tổng tiền còn trong tài khoản khách",
      icon: Sparkles,
      glow: "shadow-[0_0_20px_-5px_rgba(217,70,239,0.15)]",
      border: "hover:border-fuchsia-500/30",
      iconColor: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
      accent: "from-fuchsia-500/10 to-transparent",
    },
    {
      name: "Tổng lợi nhuận",
      value: formatCurrency(total.profit),
      note: `Biên lãi trung bình ${total.margin_percent.toFixed(1)}%`,
      icon: TrendingUp,
      glow: "shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]",
      border: "hover:border-emerald-500/30",
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      accent: "from-emerald-500/10 to-transparent",
    },
  ];

  const spotlightCards = [
    {
      title: "Hôm nay",
      metrics: [
        { label: "Khách nạp", value: formatCurrency(today.customer_deposit), color: "text-amber-400" },
        { label: "Khách tiêu", value: formatCurrency(today.customer_spent), color: "text-sky-400" },
        { label: "Lợi nhuận", value: formatCurrency(today.profit), color: "text-emerald-400" },
      ],
    },
    {
      title: "Tháng này",
      metrics: [
        { label: "Khách nạp", value: formatCurrency(month.customer_deposit), color: "text-amber-400" },
        { label: "Khách tiêu", value: formatCurrency(month.customer_spent), color: "text-sky-400" },
        { label: "Lợi nhuận", value: formatCurrency(month.profit), color: "text-emerald-400" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome & System stats Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1e293b]/80 via-[#0f172a]/95 to-[#0f172a]/90 p-5 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between relative z-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400">Hệ thống đang hoạt động</p>
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-white">
              Chào mừng trở lại, Admin
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Theo dõi tách bạch nạp ví, số tiền khách tiêu và lợi nhuận thực tế trên các đơn hàng thành công của Shop Thịnh Sáng.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 xl:min-w-[420px] w-full xl:w-auto">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-3 transition duration-200 text-center xl:text-left">
              <div className="flex items-center justify-center xl:justify-start gap-2 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Game</span>
              </div>
              <p className="mt-1.5 text-xl font-bold text-white">{games.length}</p>
              <p className="text-[10px] text-zinc-500">Đang bật bán</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-3 transition duration-200 text-center xl:text-left">
              <div className="flex items-center justify-center xl:justify-start gap-2 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                <Package className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Gói nạp</span>
              </div>
              <p className="mt-1.5 text-xl font-bold text-white">{packages.length}</p>
              <p className="text-[10px] text-zinc-500">Đang quản lý</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-3 transition duration-200 text-center xl:text-left">
              <div className="flex items-center justify-center xl:justify-start gap-2 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Khách hàng</span>
              </div>
              <p className="mt-1.5 text-xl font-bold text-white">{customers.length}</p>
              <p className="text-[10px] text-zinc-500">Tài khoản</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Metric Cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {topCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111c2a]/40 p-4 transition-all duration-300 ${card.border} ${card.glow} hover:-translate-y-1`}
            >
              {/* Internal glowing accent */}
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.accent} blur-xl opacity-40 group-hover:opacity-60 transition duration-300 pointer-events-none`} />
              
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">{card.name}</p>
                  <p className="mt-2.5 break-words text-lg sm:text-2xl font-bold text-white tracking-tight">{card.value}</p>
                  <p className="mt-1.5 text-[10px] text-zinc-400 truncate">{card.note}</p>
                </div>
                <div className={`rounded-xl border p-2 flex-shrink-0 transition-transform duration-300 group-hover:rotate-6 ${card.iconColor}`}>
                  <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Charts & Pulse Section */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_0.9fr]">
        {/* Dynamic Chart Container */}
        <div className="rounded-2xl border border-white/5 bg-[#111c2a]/20 p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Hoạt động tài chính</p>
                <h2 className="mt-1 text-base font-bold text-white sm:text-lg">So sánh Nạp ví, Khách tiêu & Lợi nhuận</h2>
                <p className="text-xs text-zinc-500">
                  {chartMode === "daily" ? "Hiển thị 30 ngày gần đây" : "Hiển thị 6 tháng gần đây"}
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
                        ? "bg-cyan-505 text-slate-950 shadow-md bg-cyan-400"
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

          {/* Interactive Chart Workspace */}
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

        {/* Pulse & Holding Rate */}
        <div className="space-y-4">
          {/* Revenue Blocks */}
          <div className="rounded-2xl border border-white/5 bg-[#111c2a]/20 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-zinc-200 border-b border-white/5 pb-3">
              <CalendarDays className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Doanh thu thời gian</h3>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 xl:grid-cols-1">
              {spotlightCards.map((block) => (
                <div key={block.title} className="rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] p-3.5 transition duration-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">{block.title}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                      Trực tiếp
                    </span>
                  </div>
                  <div className="mt-3.5 space-y-2.5">
                    {block.metrics.map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-medium">{metric.label}</span>
                        <span className={`font-bold ${metric.color}`}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Wallet Rate */}
          <div className="rounded-2xl border border-white/5 bg-[#111c2a]/20 p-4 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Khả năng giữ tiền mặt</h3>
            <div className="mt-3.5 rounded-xl border border-fuchsia-500/10 bg-gradient-to-b from-fuchsia-500/[0.02] to-transparent p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Số dư khả dụng trong ví khách</p>
              <p className="mt-2 text-xl font-bold text-white tracking-tight">{formatCurrency(total.wallet_balance || 0)}</p>
              
              {/* Fancy progress bar */}
              <div className="mt-3.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      total.customer_deposit > 0 ? ((total.wallet_balance || 0) / total.customer_deposit) * 100 : 0
                    )}%`,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-amber-400 shadow-[0_0_8px_rgba(217,70,239,0.3)]"
                />
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-zinc-400 font-medium">
                Hiện tại còn khoảng{" "}
                <span className="font-bold text-fuchsia-400">
                  {total.customer_deposit > 0
                    ? (((total.wallet_balance || 0) / total.customer_deposit) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>{" "}
                tiền mặt đang được lưu giữ trong ví người dùng thay vì rút ra hoặc chi tiêu hết.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Details (Bottom Panels) */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Latest Orders */}
        <div className="rounded-2xl border border-white/5 bg-[#111c2a]/20 p-4 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-200">
              <ShoppingCart className="h-4 w-4 text-sky-400" />
              Đơn hàng gần đây
            </h3>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition group">
              Xem chi tiết <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {orders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0 font-bold text-xs uppercase">
                    {order.game_name ? order.game_name.charAt(0) : "G"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{order.game_name}</p>
                    <p className="mt-1 truncate text-[11px] text-zinc-400">{order.package_name} · <span className="font-mono text-zinc-500">#{order.id}</span></p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 text-left sm:text-right pl-12 sm:pl-0">
                  <div>
                    <p className="text-xs font-bold text-white">{formatCurrency(Number(order.amount))}</p>
                    <p className="mt-1 text-[9px] text-zinc-500 font-medium">
                      {new Date(order.created_at || Date.now()).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div>{renderStatusBadge(order.status)}</div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center py-6 text-xs text-zinc-500">Chưa có đơn hàng nào.</p>
            )}
          </div>
        </div>

        {/* Latest Wallet Logs */}
        <div className="rounded-2xl border border-white/5 bg-[#111c2a]/20 p-4 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-200">
              <Wallet className="h-4 w-4 text-amber-400" />
              Nạp ví mới nhất
            </h3>
            <Link href="/admin/wallet-logs" className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition group">
              Xem chi tiết <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {walletLogs.slice(0, 5).map((log: any) => {
              const name = log.user_name || log.name_user || "Khách hàng";
              return (
                <div key={log.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 font-bold text-xs uppercase">
                      {name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">{name}</p>
                      <p className="mt-1 truncate text-[11px] text-zinc-400">{log.email || "Không có email"} · <span className="font-mono text-zinc-500">#{log.id}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 text-left sm:text-right pl-12 sm:pl-0">
                    <div>
                      <p className="text-xs font-bold text-white">{formatCurrency(Number(log.amount))}</p>
                      <p className="mt-1 text-[9px] text-zinc-500 font-medium">
                        {new Date(log.created_at || Date.now()).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div>{renderStatusBadge(log.status)}</div>
                  </div>
                </div>
              );
            })}
            {walletLogs.length === 0 && (
              <p className="text-center py-6 text-xs text-zinc-500">Chưa có giao dịch nạp ví nào.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
