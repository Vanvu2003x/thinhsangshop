"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gamepad2,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Send,
  ShoppingCart,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { adminApi } from "./adminApi";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const isLoginPath = pathname === "/admin/login";
    const user = adminApi.checkAuth();

    if (!user || user.role !== "admin") {
      if (!isLoginPath) {
        router.push("/admin/login");
      } else {
        setLoading(false);
      }
      return;
    }

    setAdminUser(user);
    setAuthorized(true);
    setLoading(false);
    if (isLoginPath) {
      router.push("/admin");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    adminApi.logout();
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#182232] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">Đang xác thực hệ thống...</p>
        </div>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!authorized) {
    return null;
  }

  const menuItems = [
    { name: "Dashboard Tổng Quan", path: "/admin", icon: LayoutDashboard },
    { name: "Quản Lý Game", path: "/admin/games", icon: Gamepad2 },
    { name: "Quản Lý Gói Nạp", path: "/admin/packages", icon: Package },
    { name: "Quản Lý Đơn Nạp", path: "/admin/orders", icon: ShoppingCart },
    { name: "Quản Lý Đơn Nạp Ví", path: "/admin/wallet-logs", icon: Wallet },
    { name: "Quản Lý Kho Acc", path: "/admin/accounts", icon: Layers },
    { name: "Đơn Hàng Acc", path: "/admin/account-orders", icon: Send },
    { name: "Quản Lý Khách Hàng", path: "/admin/customers", icon: Users },
    { name: "Quản Lý Doanh Thu", path: "/admin/revenue", icon: TrendingUp },
  ];

  return (
    <div className="flex min-h-screen bg-[#182232] font-sans text-zinc-100">
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-purple-900/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-cyan-900/10 blur-[120px]" />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-[#1e293b]/50 backdrop-blur-md transition-transform duration-300 xl:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 text-lg font-bold text-white">
              S
            </div>
            <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-lg font-bold text-transparent">
              Shop Thịnh Sáng Admin
            </span>
          </div>
          <button className="text-zinc-400 hover:text-white xl:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/5 bg-[#0f172a]/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/15 font-semibold text-purple-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">{adminUser?.name_user || "Admin"}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <p className="text-xs text-zinc-400">Quản trị viên</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 ${isActive ? "border border-purple-500/20 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 text-white shadow-lg shadow-purple-500/5" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}`}
              >
                <Icon className={`h-5 w-5 transition duration-200 ${isActive ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 bg-[#0f172a]/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-400 transition duration-200 hover:bg-rose-500/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-[#0b0f19]/60 backdrop-blur-sm xl:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden xl:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#1e293b]/30 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-white xl:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="hidden text-lg font-semibold text-zinc-200 sm:block">
              {menuItems.find((item) => item.path === pathname)?.name || "Hệ thống Quản trị"}
            </h2>
          </div>
        </header>

        <main className="relative min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
