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

  if (loading || !dashboard) {
    if (!loading && !dashboard) {
      return (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          Không tải được dữ liệu dashboard tài chính. Kiểm tra lại API thống kê rồi tải lại trang.
        </div>
      );
    }

    return (
      <div className="flex h-96 items-center justify-center text-zinc-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const total = dashboard.total;
  const today = dashboard.today;
  const month = dashboard.this_month;
  const chartData = chartMode === "daily" ? dashboard.charts.daily : dashboard.charts.monthly;
  const chartColumnMinWidth = chartMode === "daily" ? "min-w-[36px] sm:min-w-[42px]" : "min-w-[52px] sm:min-w-[60px]";
  const maxChartValue = Math.max(
    1,
    ...chartData.flatMap((point) => [point.customer_deposit, point.customer_spent, point.profit])
  );

  const topCards = [
    {
      name: "Tổng tiền khách nạp",
      value: formatCurrency(total.customer_deposit),
      note: "Tất cả giao dịch nạp ví thành công",
      icon: Wallet,
      accent: "from-amber-500/20 via-amber-400/10 to-transparent",
      border: "border-amber-400/20",
      iconColor: "text-amber-300",
    },
    {
      name: "Tổng khách đã tiêu",
      value: formatCurrency(total.customer_spent),
      note: `${total.success_order_count} đơn đã hoàn tất`,
      icon: DollarSign,
      accent: "from-sky-500/20 via-sky-400/10 to-transparent",
      border: "border-sky-400/20",
      iconColor: "text-sky-300",
    },
    {
      name: "Số dư còn trong ví",
      value: formatCurrency(total.wallet_balance || 0),
      note: "Tổng tiền user còn giữ trong hệ thống",
      icon: Sparkles,
      accent: "from-fuchsia-500/20 via-fuchsia-400/10 to-transparent",
      border: "border-fuchsia-400/20",
      iconColor: "text-fuchsia-300",
    },
    {
      name: "Tổng lợi nhuận",
      value: formatCurrency(total.profit),
      note: `Biên lãi ${total.margin_percent.toFixed(1)}%`,
      icon: TrendingUp,
      accent: "from-emerald-500/20 via-emerald-400/10 to-transparent",
      border: "border-emerald-400/20",
      iconColor: "text-emerald-300",
    },
  ];

  const spotlightCards = [
    {
      title: "Hôm nay",
      metrics: [
        { label: "Khách nạp", value: formatCurrency(today.customer_deposit), color: "text-amber-300" },
        { label: "Khách tiêu", value: formatCurrency(today.customer_spent), color: "text-sky-300" },
        { label: "Lợi nhuận", value: formatCurrency(today.profit), color: "text-emerald-300" },
      ],
    },
    {
      title: "Tháng này",
      metrics: [
        { label: "Khách nạp", value: formatCurrency(month.customer_deposit), color: "text-amber-300" },
        { label: "Khách tiêu", value: formatCurrency(month.customer_spent), color: "text-sky-300" },
        { label: "Lợi nhuận", value: formatCurrency(month.profit), color: "text-emerald-300" },
      ],
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.88))] p-4 shadow-2xl sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/70">Bảng điều khiển tài chính</p>
            <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
              Doanh thu, nạp ví và lợi nhuận đã được tách riêng
            </h1>
            <p className="mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-zinc-300">
              Dashboard này đang hiển thị tách bạch ba dòng tiền chính: khách nạp vào ví, khách tiêu vào đơn,
              và phần tiền vẫn còn nằm trong ví user. Lợi nhuận chỉ tính trên đơn thành công.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 xl:min-w-[460px] w-full xl:w-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-4">
              <p className="text-[9px] xs:text-[10px] sm:text-[11px] uppercase tracking-[0.1em] xs:tracking-[0.25em] text-zinc-500">Game</p>
              <p className="mt-2 text-base xs:text-lg sm:text-2xl font-black text-white">{games.length}</p>
              <p className="mt-1 text-[10px] sm:text-xs text-zinc-400 hidden xs:block">Tựa game đang bật bán</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-4">
              <p className="text-[9px] xs:text-[10px] sm:text-[11px] uppercase tracking-[0.1em] xs:tracking-[0.25em] text-zinc-500">Gói nạp</p>
              <p className="mt-2 text-base xs:text-lg sm:text-2xl font-black text-white">{packages.length}</p>
              <p className="mt-1 text-[10px] sm:text-xs text-zinc-400 hidden xs:block">Package đang quản lý</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-4">
              <p className="text-[9px] xs:text-[10px] sm:text-[11px] uppercase tracking-[0.1em] xs:tracking-[0.25em] text-zinc-500">Khách hàng</p>
              <p className="mt-2 text-base xs:text-lg sm:text-2xl font-black text-white">{customers.length}</p>
              <p className="mt-1 text-[10px] sm:text-xs text-zinc-400 hidden xs:block">Tài khoản người dùng</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 sm:gap-5">
        {topCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className={`relative overflow-hidden rounded-3xl border ${card.border} bg-[#0f172a] p-3.5 shadow-xl sm:p-5`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent}`} />
              <div className="relative flex items-start justify-between gap-3 sm:gap-4">
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.25em] text-zinc-500">{card.name}</p>
                  <p className="mt-2 sm:mt-3 break-words text-lg xs:text-xl sm:text-3xl font-black text-white">{card.value}</p>
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs leading-4 sm:leading-5 text-zinc-400">{card.note}</p>
                </div>
                <div className={`rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-3 ${card.iconColor} flex-shrink-0`}>
                  <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="rounded-2xl border border-white/8 bg-[#0f172a] p-4 shadow-2xl sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Dòng tiền vận hành</p>
              <h2 className="mt-2 text-base font-bold text-white sm:text-lg">Biểu đồ khách nạp, khách tiêu và lợi nhuận</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {chartMode === "daily" ? "Theo 30 ngày gần nhất" : "Theo 6 tháng gần nhất"}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 rounded-2xl border border-white/8 bg-white/[0.03] p-1 sm:flex sm:w-fit">
              {chartModes.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setChartMode(mode.key)}
                  className={`rounded-2xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                    chartMode === mode.key
                      ? "bg-cyan-400 text-slate-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-xs text-zinc-300">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Khách nạp</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-300" /> Khách tiêu</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /> Lợi nhuận</span>
          </div>

          <div className="mt-5 flex h-[240px] items-end gap-1.5 overflow-x-auto pb-2 sm:mt-6 sm:h-[280px] sm:gap-2.5">
            {chartData.map((point) => {
              const depositHeight = (point.customer_deposit / maxChartValue) * 100;
              const spentHeight = (point.customer_spent / maxChartValue) * 100;
              const profitHeight = (point.profit / maxChartValue) * 100;

              return (
                <div key={point.label} className={`group flex flex-1 flex-col items-center ${chartColumnMinWidth}`}>
                  <div className="flex h-[180px] w-full items-end justify-center gap-0.5 sm:gap-1 rounded-2xl border border-white/6 bg-white/[0.03] px-1 pb-1.5 pt-2 sm:h-[220px] sm:px-1.5 sm:pb-2.5 sm:pt-3">
                    <div className="relative h-full flex-1">
                      <div
                        style={{ height: `${depositHeight}%` }}
                        className="absolute bottom-0 w-full rounded-t-2xl bg-gradient-to-t from-amber-500 to-amber-300 transition-all duration-500 group-hover:brightness-110"
                      />
                    </div>
                    <div className="relative h-full flex-1">
                      <div
                        style={{ height: `${spentHeight}%` }}
                        className="absolute bottom-0 w-full rounded-t-2xl bg-gradient-to-t from-sky-600 to-sky-300 transition-all duration-500 group-hover:brightness-110"
                      />
                    </div>
                    <div className="relative h-full flex-1">
                      <div
                        style={{ height: `${profitHeight}%` }}
                        className="absolute bottom-0 w-full rounded-t-2xl bg-gradient-to-t from-emerald-600 to-emerald-300 transition-all duration-500 group-hover:brightness-110"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-zinc-400 sm:mt-3 sm:text-xs">{point.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl border border-white/8 bg-[#111827] p-4 shadow-xl sm:p-4.5">
            <div className="flex items-center gap-2 text-zinc-200">
              <CalendarDays className="h-4 w-4 text-cyan-300" />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Nhịp doanh thu</h3>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 xl:grid-cols-1">
              {spotlightCards.map((block) => (
                <div key={block.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">{block.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Live</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {block.metrics.map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">{metric.label}</span>
                        <span className={`font-bold ${metric.color}`}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[#111827] p-4 shadow-xl sm:p-4.5">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-200">Tỷ lệ giữ tiền</h3>
            <div className="mt-4 rounded-2xl border border-fuchsia-400/10 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.16),_transparent_55%),rgba(255,255,255,0.03)] p-3.5 sm:p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Tiền đang nằm trong ví user</p>
              <p className="mt-2.5 break-words text-xl font-bold text-white sm:text-2xl">{formatCurrency(total.wallet_balance || 0)}</p>
              <div className="mt-4 h-2 rounded-full bg-white/8">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      total.customer_deposit > 0 ? ((total.wallet_balance || 0) / total.customer_deposit) * 100 : 0
                    )}%`,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-amber-300"
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-400">
                So với tổng tiền khách từng nạp vào hệ thống, hiện còn khoảng{" "}
                <span className="font-bold text-fuchsia-300">
                  {total.customer_deposit > 0
                    ? (((total.wallet_balance || 0) / total.customer_deposit) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>{" "}
                đang tồn trong ví.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-[#0f172a] p-4 shadow-xl sm:p-4.5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">
              <ShoppingCart className="h-4 w-4 text-sky-300" />
              Đơn nạp gần nhất
            </h3>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              Xem tất cả <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/6">
            {orders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{order.game_name}</p>
                  <p className="mt-1 truncate text-xs text-zinc-400">{order.package_name} · #{order.id}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold text-sky-300">{formatCurrency(Number(order.amount))}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0f172a] p-4 shadow-xl sm:p-4.5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">
              <Wallet className="h-4 w-4 text-amber-300" />
              Nạp ví mới nhất
            </h3>
            <Link href="/admin/wallet-logs" className="flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200">
              Xem tất cả <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/6">
            {walletLogs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{log.user_name || log.name_user || "Khách hàng"}</p>
                  <p className="mt-1 truncate text-xs text-zinc-400">{log.email || "Không có email"} · {log.id}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold text-amber-300">{formatCurrency(Number(log.amount))}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">{log.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4.5 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-[#0f172a] p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">User</p>
              <p className="text-lg font-bold text-white">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0f172a] p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-400/10 p-2.5 text-sky-300">
              <Gamepad2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Game</p>
              <p className="text-lg font-bold text-white">{games.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0f172a] p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-fuchsia-400/10 p-2.5 text-fuchsia-300">
              <Package className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Package</p>
              <p className="text-lg font-bold text-white">{packages.length}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
