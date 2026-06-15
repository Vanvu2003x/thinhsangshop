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
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          Không tải được dữ liệu doanh thu. Kiểm tra lại API thống kê rồi tải lại trang.
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
      tone: "text-sky-300",
      shell: "border-sky-400/20 bg-sky-400/10",
    },
    {
      title: "Tổng lợi nhuận",
      value: formatCurrency(total.profit),
      sub: "Tiền bán trừ tiền gốc",
      icon: TrendingUp,
      tone: "text-emerald-300",
      shell: "border-emerald-400/20 bg-emerald-400/10",
    },
    {
      title: "Tổng giá vốn",
      value: formatCurrency(total.cost),
      sub: "Chi phí nhập đơn thành công",
      icon: Receipt,
      tone: "text-rose-300",
      shell: "border-rose-400/20 bg-rose-400/10",
    },
    {
      title: "Tổng khách nạp",
      value: formatCurrency(total.customer_deposit),
      sub: "Tiền nạp ví cộng dồn",
      icon: Wallet,
      tone: "text-amber-300",
      shell: "border-amber-400/20 bg-amber-400/10",
    },
    {
      title: "Tồn ví hiện tại",
      value: formatCurrency(total.wallet_balance || 0),
      sub: "Số dư còn ở user",
      icon: Sparkles,
      tone: "text-fuchsia-300",
      shell: "border-fuchsia-400/20 bg-fuchsia-400/10",
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
    <div className="space-y-4 sm:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_24%),linear-gradient(145deg,_rgba(15,23,42,0.98),_rgba(17,24,39,0.92))] p-4 shadow-2xl sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/75">Revenue Center</p>
            <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
              Trang doanh thu giờ tách đúng từng dòng tiền
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-300">
              `Khách nạp` là tiền vào ví, `khách tiêu` là tiền chạy qua đơn thành công, `lợi nhuận` chỉ lấy theo
              công thức tiền bán trừ tiền gốc. Biểu đồ bên dưới hiển thị dữ liệu thật theo ngày và theo tháng.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 lg:min-w-[280px]">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Biên lợi nhuận toàn hệ thống</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-emerald-400/20 bg-emerald-400/10 text-emerald-300 sm:h-16 sm:w-16">
                <Percent className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white sm:text-2xl">{total.margin_percent.toFixed(1)}%</p>
                <p className="mt-1 text-xs text-zinc-400">Tính trên tổng khách đã tiêu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 sm:gap-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-3xl border border-white/8 bg-[#0f172a] p-3.5 shadow-xl sm:p-5 last:col-span-2 sm:last:col-span-2 lg:last:col-span-1"
            >
              <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.25em] text-zinc-500">{card.title}</p>
                  <p className="mt-2 sm:mt-3 break-words text-lg xs:text-xl sm:text-2xl font-black text-white">{card.value}</p>
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-zinc-400">{card.sub}</p>
                </div>
                <div className={`rounded-xl sm:rounded-2xl border p-2 sm:p-3 ${card.shell} ${card.tone} flex-shrink-0`}>
                  <Icon className="h-4.5 w-4.5 sm:h-5 w-5" />
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
              <h2 className="text-base font-bold text-white sm:text-lg">Doanh thu và lợi nhuận theo chu kỳ</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {chartMode === "daily" ? "30 mốc ngày gần nhất" : "6 mốc tháng gần nhất"}
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
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Tổng hợp kỳ</h3>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 xl:grid-cols-1">
              {periodBlocks.map((block) => (
                <div key={block.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">{block.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                      {block.data.margin_percent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Khách nạp</span>
                      <span className="font-bold text-amber-300">{formatCurrency(block.data.customer_deposit)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Khách tiêu</span>
                      <span className="font-bold text-sky-300">{formatCurrency(block.data.customer_spent)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Giá vốn</span>
                      <span className="font-bold text-rose-300">{formatCurrency(block.data.cost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Lợi nhuận</span>
                      <span className="font-bold text-emerald-300">{formatCurrency(block.data.profit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[#111827] p-4 shadow-xl sm:p-4.5">
            <div className="flex items-center gap-2 text-zinc-200">
              <BarChart3 className="h-4 w-4 text-fuchsia-300" />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Danh sách mốc</h3>
            </div>

            <div className="mt-5 max-h-[320px] space-y-3 overflow-y-auto pr-1">
              {[...chartData].reverse().map((point) => (
                <div key={point.label} className="rounded-2xl border border-white/6 bg-white/[0.03] p-3.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">{point.label}</p>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                      {point.margin_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Khách nạp</span>
                      <span className="font-semibold text-amber-300">{formatCurrency(point.customer_deposit)}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Khách tiêu</span>
                      <span className="font-semibold text-sky-300">{formatCurrency(point.customer_spent)}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Lợi nhuận</span>
                      <span className="font-semibold text-emerald-300">{formatCurrency(point.profit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#0f172a] p-4 shadow-2xl sm:p-4.5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">
              <Receipt className="h-4 w-4 text-cyan-300" />
              Chi tiết đơn tạo lợi nhuận
            </h3>
            <p className="mt-1 text-xs text-zinc-400">Bảng này chỉ tính các đơn thành công và lấy đúng profit đã lưu ở backend.</p>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Game / Gói</th>
                <th className="px-4 py-3">Giá vốn</th>
                <th className="px-4 py-3">Giá bán</th>
                <th className="px-4 py-3">Lợi nhuận</th>
                <th className="px-4 py-3">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6 text-zinc-200">
              {successOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Chưa có đơn thành công nào để thống kê.
                  </td>
                </tr>
              ) : (
                successOrders.map((order: any) => {
                  const profitValue = Number(order.profit || 0);
                  const costValue = Number(order.amount) - profitValue;

                  return (
                    <tr key={order.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-mono font-bold text-cyan-300">#{order.id}</td>
                      <td className="px-4 py-3">
                        <span className="block font-semibold text-white">{order.game_name}</span>
                        <span className="mt-1 block text-xs text-zinc-500">{order.package_name}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-rose-300">{formatCurrency(costValue)}</td>
                      <td className="px-4 py-3 font-semibold text-sky-300">{formatCurrency(Number(order.amount))}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-300">{formatCurrency(profitValue)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
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

        <div className="space-y-3 lg:hidden">
          {successOrders.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-8 text-center text-sm text-zinc-500">
              Chưa có đơn thành công nào để thống kê.
            </div>
          ) : (
            successOrders.map((order: any) => {
              const profitValue = Number(order.profit || 0);
              const costValue = Number(order.amount) - profitValue;

              return (
                <div key={order.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-cyan-300">#{order.id}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{order.game_name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{order.package_name}</p>
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                      {new Date(order.updated_at || order.created_at).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Giá vốn</span>
                      <span className="font-semibold text-rose-300">{formatCurrency(costValue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Giá bán</span>
                      <span className="font-semibold text-sky-300">{formatCurrency(Number(order.amount))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Lợi nhuận</span>
                      <span className="font-semibold text-emerald-300">{formatCurrency(profitValue)}</span>
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
