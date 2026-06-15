"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from './adminApi';
import {
  LayoutDashboard,
  Gamepad2,
  Package,
  ShoppingCart,
  Wallet,
  Users,
  TrendingUp,
  LogOut,
  Menu,
  X,
  User,
  ShieldAlert,
  Layers,
  Send
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const isLoginPath = pathname === '/admin/login';
    const user = adminApi.checkAuth();

    if (!user || user.role !== 'admin') {
      if (!isLoginPath) {
        router.push('/admin/login');
      } else {
        setLoading(false);
      }
    } else {
      setAdminUser(user);
      setAuthorized(true);
      setLoading(false);
      if (isLoginPath) {
        router.push('/admin');
      }
    }
  }, [pathname, router]);

  const handleLogout = () => {
    adminApi.logout();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#182232] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm">Đang xác thực hệ thống...</p>
        </div>
      </div>
    );
  }

  // If on login page, don't show the layout frame
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!authorized) {
    return null;
  }

  const menuItems = [
    { name: 'Dashboard Tổng Quan', path: '/admin', icon: LayoutDashboard },
    { name: 'Quản Lý Game', path: '/admin/games', icon: Gamepad2 },
    { name: 'Quản Lý Gói Nạp', path: '/admin/packages', icon: Package },
    { name: 'Quản Lý Đơn Nạp', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Quản Lý Đơn Nạp Ví', path: '/admin/wallet-logs', icon: Wallet },
    { name: 'Quản Lý Kho Acc', path: '/admin/accounts', icon: Layers },
    { name: 'Đơn Hàng Acc', path: '/admin/account-orders', icon: Send },
    { name: 'Quản Lý Khách Hàng', path: '/admin/customers', icon: Users },
    { name: 'Quản Lý Doanh Thu', path: '/admin/revenue', icon: TrendingUp },
  ];

  return (
    <div className="flex min-h-screen bg-[#182232] text-zinc-100 font-sans">
      {/* Background neon glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#1e293b]/50 backdrop-blur-md border-r border-white/5 flex flex-col transition-transform duration-300 xl:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
              S
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Shop Thịnh Sáng Admin
            </span>
          </div>
          <button className="xl:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">{adminUser?.name_user || 'Admin'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs text-zinc-400">Quản trị viên</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 group ${isActive ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-purple-500/20 text-white shadow-lg shadow-purple-500/5' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
              >
                <Icon className={`w-5 h-5 transition duration-200 ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout section */}
        <div className="p-4 border-t border-white/5 bg-[#0f172a]/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-[#0b0f19]/60 backdrop-blur-sm xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 xl:pl-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#1e293b]/30 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <button className="xl:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-semibold text-lg text-zinc-200 hidden sm:block">
              {menuItems.find(item => item.path === pathname)?.name || 'Hệ thống Quản trị'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
          </div>
        </header>

        {/* Child Pages Container */}
        <main className="relative flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
