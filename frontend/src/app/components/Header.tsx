"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clientApi } from "../clientApi";
import {
  ChevronDown,
  Gamepad2,
  Headphones,
  History,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
  X,
} from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const user = clientApi.checkAuth();
      if (!user) return;

      try {
        const profile = await clientApi.getProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error(error);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function syncHash() {
      setCurrentHash(window.location.hash);
    }

    loadUser();
    syncHash();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("hashchange", syncHash);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  const handleLogout = () => {
    clientApi.logout();
    setUserProfile(null);
    setDropdownOpen(false);
    router.push("/");
    window.location.reload();
  };

  const isGamesAnchorActive = pathname === "/" && currentHash === "#games-list";

  const navLinks = [
    { name: "TRANG CHỦ", href: "/", active: pathname === "/" && !isGamesAnchorActive, icon: Home },
    { name: "DANH SÁCH GAME", href: "/#games-list", active: isGamesAnchorActive, icon: Sparkles },
    { name: "LỊCH SỬ ĐƠN HÀNG", href: "/history", active: pathname === "/history", icon: History },
    { name: "LIÊN HỆ", href: "/contact", active: pathname === "/contact", icon: Headphones },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2d3a54] bg-[#374669] shadow-lg">
      <div className="mx-auto flex min-h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:min-h-20 sm:px-6">
        <Link href="/" className="group flex items-center">
          <div className="relative flex h-11 items-center justify-center sm:h-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-main.png"
              alt="Shop Thịnh Sáng"
              className="relative z-10 h-full w-auto object-contain transition duration-300 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-xs font-semibold tracking-wider text-zinc-300 xl:flex">
          {navLinks.map((link) => {
            const IconComp = link.icon;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative flex items-center gap-1.5 py-2 transition-all duration-300 hover:text-white ${
                  link.active ? "font-extrabold text-cyan-400" : ""
                }`}
              >
                <IconComp className="h-3.5 w-3.5" />
                <span>{link.name}</span>
                {link.active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          {userProfile ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#172237] px-5 py-2.5 text-xs font-extrabold text-zinc-200 shadow-lg transition-all duration-300 hover:border-cyan-500/30 hover:bg-[#1f2e4a]"
              >
                <Wallet className="h-4 w-4 text-cyan-400" />
                <span>Số dư: {Number(userProfile.balance || 0).toLocaleString("vi-VN")}đ</span>
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#172237] px-4 py-2 text-xs font-bold text-zinc-300 shadow-md transition duration-300 hover:bg-[#1f2e4a] hover:text-white"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-[10px] font-extrabold text-cyan-400">
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <span>Tài khoản</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-300 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2.5 w-56 animate-in slide-in-from-top-2 rounded-2xl border border-white/10 bg-[#121b2d] py-2 shadow-2xl duration-200">
                    <div className="mb-1.5 border-b border-white/5 px-4 py-2">
                      <div className="truncate text-xs font-extrabold text-white">{userProfile.name}</div>
                      <div className="mt-0.5 truncate text-[10px] text-zinc-500">{userProfile.email}</div>
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-cyan-400">
                        <ShieldCheck className="h-3 w-3" />
                        Lvl {userProfile.level}
                      </div>
                    </div>

                    <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white">
                      <User className="h-4 w-4 text-cyan-400" />
                      Thông tin cá nhân
                    </Link>
                    <Link href="/history" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white">
                      <History className="h-4 w-4 text-cyan-400" />
                      Lịch sử giao dịch
                    </Link>
                    <Link href="/account/don-hang" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white">
                      <Gamepad2 className="h-4 w-4 text-cyan-400" />
                      Lịch sử mua Acc
                    </Link>

                    {userProfile.role === "admin" && (
                      <Link href="/admin" onClick={() => setDropdownOpen(false)} className="mt-1 flex items-center gap-2.5 border-t border-white/5 px-4 py-2.5 pt-2 text-xs text-amber-400 transition hover:bg-white/5 hover:text-white">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        Quản trị hệ thống
                      </Link>
                    )}

                    <button onClick={handleLogout} className="mt-1.5 flex w-full items-center gap-2.5 border-t border-white/5 px-4 py-2.5 pt-2 text-left text-xs text-rose-400 transition hover:bg-rose-500/10 hover:text-white">
                      <LogOut className="h-4 w-4" />
                      Đăng xuất tài khoản
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#172237]/40 px-5 py-2.5 text-xs font-extrabold text-zinc-300 transition duration-300 hover:border-white/20 hover:bg-[#1f2e4a]/60 hover:text-white">
                <User className="h-4 w-4 text-cyan-400" />
                <span>Đăng nhập</span>
              </Link>
              <Link href="/register" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 active:scale-[0.98]">
                <Wallet className="h-4 w-4 text-white" />
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 xl:hidden">
          {userProfile && (
            <Link href="/profile" className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#172237] px-3 py-1.5 text-[10px] font-bold text-zinc-200">
              <Wallet className="h-3 w-3 text-cyan-400" />
              <span>{Number(userProfile.balance || 0).toLocaleString("vi-VN")}đ</span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-300 transition duration-300 hover:text-white"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="animate-in slide-in-from-top-5 space-y-4 border-t border-white/5 bg-[#374669] px-4 py-5 shadow-2xl duration-200 xl:hidden">
          <div className="flex flex-col gap-3 text-sm font-semibold text-zinc-300">
            {navLinks.map((link) => {
              const IconComp = link.icon;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white ${
                    link.active ? "bg-cyan-500/10 text-cyan-400" : ""
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-white/5 pt-4">
            {userProfile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-400">
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{userProfile.name}</div>
                    <div className="text-[10px] text-zinc-500">{userProfile.email}</div>
                  </div>
                </div>

                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white">
                  <User className="h-4.5 w-4.5 text-cyan-400" />
                  Thông tin cá nhân
                </Link>
                <Link href="/history" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white">
                  <History className="h-4.5 w-4.5 text-cyan-400" />
                  Lịch sử giao dịch
                </Link>
                <Link href="/account/don-hang" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white">
                  <Gamepad2 className="h-4.5 w-4.5 text-cyan-400" />
                  Lịch sử mua Acc
                </Link>

                {userProfile.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-amber-400 transition hover:bg-white/5 hover:text-white">
                    <Sparkles className="h-4.5 w-4.5 text-amber-400" />
                    Quản trị hệ thống
                  </Link>
                )}

                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-rose-400 transition hover:bg-rose-500/10">
                  <LogOut className="h-4.5 w-4.5" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 px-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center rounded-xl border border-white/10 py-2.5 text-xs font-bold text-zinc-300">
                  Đăng nhập
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-xs font-bold text-white">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
