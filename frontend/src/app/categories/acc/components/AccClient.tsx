"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clientApi } from '../../../clientApi';
import AccCard from './accCard';
import Header from '../../../components/Header';
import {
  Search,
  Filter,
  ChevronDown,
  X,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';

interface AccClientProps {
  gamecode?: string;
}

export default function AccClient({ gamecode }: AccClientProps) {
  const router = useRouter();
  
  const [games, setGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [accList, setAccList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState(1);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Sidebar search
  const [gameSearch, setGameSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Fetch games list
  useEffect(() => {
    async function loadGames() {
      try {
        const list = await clientApi.getGames();
        const activeGames = (Array.isArray(list) ? list : []).filter(
          (g: any) => !g.status || g.status === 'active'
        );
        setGames(activeGames);
      } catch (error) {
        console.error("Lỗi khi tải game:", error);
      }
    }
    loadGames();
  }, []);

  // Fetch profile to get user level
  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await clientApi.getProfile();
        if (user && user.level) {
          setUserLevel(Number(user.level));
        }
      } catch (error) {
        // Guest users may browse account listings without loading a profile.
      }
    }
    loadProfile();
  }, []);

  // Sync selectedGame with gamecode URL param
  useEffect(() => {
    if (games.length === 0) return;
    if (gamecode) {
      const matched = games.find((g) => g.gamecode === gamecode);
      if (matched) {
        setSelectedGame(matched);
      } else {
        setSelectedGame(null);
      }
    } else {
      setSelectedGame(null);
    }
  }, [gamecode, games]);

  // Load accounts for selected game and filters
  const loadAccounts = async () => {
    if (!selectedGame) return;
    setLoading(true);
    try {
      const min = minPrice ? Number(minPrice) : undefined;
      const max = maxPrice ? Number(maxPrice) : undefined;
      
      const res = await clientApi.getAllAcc(
        selectedGame.id || selectedGame.gamecode,
        keyword,
        min,
        max,
        currentPage,
        itemsPerPage
      );

      // Backend response: { total, data: { data: [...] } }
      const accs = res?.data?.data || res?.data || res || [];
      const total = res?.total || accs.length;

      // Filter local sold accounts for client view if api is returning status
      const sellingAccs = Array.isArray(accs) 
        ? accs.filter((a: any) => a.status === 'selling') 
        : [];

      // Sort client-side
      if (sortBy === 'price_asc') {
        sellingAccs.sort((a: any, b: any) => a.price - b.price);
      } else if (sortBy === 'price_desc') {
        sellingAccs.sort((a: any, b: any) => b.price - a.price);
      } else if (sortBy === 'newest') {
        sellingAccs.sort((a: any, b: any) => Number(b.id) - Number(a.id));
      }

      setAccList(sellingAccs);
      setTotalItems(total);
    } catch (error) {
      console.error("Lỗi khi tải danh sách accounts:", error);
      setAccList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [selectedGame, keyword, minPrice, maxPrice, sortBy, currentPage]);

  const filteredGames = games.filter((g) =>
    g.name.toLowerCase().includes(gameSearch.toLowerCase())
  );

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9] font-sans text-zinc-800 selection:bg-blue-600/30">
      {/* Slate Blue Header Wrapper */}
      <div className="bg-[#374669] text-zinc-100 relative">
        <Header />
      </div>

      {/* Main Body */}
      <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 relative z-20 mt-8 mb-12 flex-1">
        <div className="bg-[#f4f6f9] border border-zinc-200/80 rounded-[2rem] p-6 sm:p-8 shadow-2xl min-h-[600px] flex flex-col md:flex-row gap-6">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col gap-6">
            {/* Category / Game Selector */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4">
              <h3 className="text-zinc-800 font-extrabold text-xs uppercase tracking-wider mb-3">
                Danh Mục Game
              </h3>
              
              {/* Game list search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Tìm game nhanh..."
                  value={gameSearch}
                  onChange={(e) => setGameSearch(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold outline-none focus:bg-white focus:border-purple-500 transition text-zinc-800"
                />
              </div>

              {/* Game list links */}
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {filteredGames.length > 0 ? (
                  filteredGames.map((g) => (
                    <Link
                      key={g.id}
                      href={`/categories/acc?gamecode=${g.gamecode}`}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold transition-all ${
                        g.gamecode === gamecode
                          ? 'bg-purple-50 text-purple-600 border border-purple-100 shadow-sm'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-purple-600'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=50&q=80'}
                        alt={g.name}
                        className="w-6 h-6 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=50&q=80";
                        }}
                      />
                      <span className="truncate flex-1">{g.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-zinc-400 font-bold">Không tìm thấy game</div>
                )}
              </div>
            </div>

            {/* Filter Panel (Only when a game is selected) */}
            {selectedGame && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h3 className="text-zinc-800 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-purple-600" />
                    Bộ Lọc
                  </h3>
                  {(keyword || minPrice || maxPrice) && (
                    <button
                      onClick={() => {
                        setKeyword('');
                        setMinPrice('');
                        setMaxPrice('');
                      }}
                      className="text-[10px] text-purple-600 hover:underline font-bold"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {/* Filter description */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Tìm theo từ khóa</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Skin, tướng, rank..."
                      value={keyword}
                      onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-purple-500 transition text-zinc-800"
                    />
                  </div>
                </div>

                {/* Price range filter */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Khoảng giá (₫)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Từ"
                      value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-purple-500 transition text-zinc-800 text-center"
                    />
                    <span className="text-zinc-400 text-xs font-bold">-</span>
                    <input
                      type="number"
                      placeholder="Đến"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-purple-500 transition text-zinc-800 text-center"
                    />
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Account Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {!gamecode ? (
              // No game selected: Show game cards
              <div className="flex-1 flex flex-col justify-center items-center py-12">
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-600">
                  Cửa Hàng Bán Nick Tự Động
                </div>
                <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-tight mb-2">VUI LÒNG CHỌN GAME</h2>
                <p className="text-zinc-500 text-sm font-medium mb-8">Chọn một tựa game bên dưới để bắt đầu duyệt mua tài khoản phù hợp</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                  {games.map((g) => (
                    <Link
                      key={g.id}
                      href={`/categories/acc?gamecode=${g.gamecode}`}
                      className="group bg-white rounded-2xl border border-zinc-200/60 overflow-hidden shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300 flex flex-col"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden bg-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80'}
                          alt={g.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-left">
                          <h4 className="text-xs font-black text-white uppercase truncate drop-shadow-md">
                            {g.name}
                          </h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              // Game selected: Show account grid
              <div className="flex-1 flex flex-col">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 mb-6">
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
                      {selectedGame ? `Tài Khoản ${selectedGame.name}` : 'Tài Khoản Game'}
                    </h2>
                    <p className="text-zinc-500 text-xs font-semibold mt-1">
                      Tìm thấy <span className="text-purple-600 font-extrabold">{totalItems}</span> tài khoản đang rao bán.
                    </p>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-bold text-zinc-500 whitespace-nowrap flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      Sắp xếp:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                      className="bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-purple-500 transition cursor-pointer shadow-sm"
                    >
                      <option value="newest">Mới đăng</option>
                      <option value="price_asc">Giá: Thấp đến Cao</option>
                      <option value="price_desc">Giá: Cao đến Thấp</option>
                    </select>
                  </div>
                </div>

                {/* Filter chips active */}
                {(keyword || minPrice || maxPrice) && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {keyword && (
                      <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-600 text-xs font-bold px-2.5 py-1 rounded-lg">
                        Tìm: {keyword}
                        <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => setKeyword('')} />
                      </span>
                    )}
                    {(minPrice || maxPrice) && (
                      <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-600 text-xs font-bold px-2.5 py-1 rounded-lg">
                        Giá: {minPrice || '0'} - {maxPrice || 'Max'}đ
                        <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => { setMinPrice(''); setMaxPrice(''); }} />
                      </span>
                    )}
                  </div>
                )}

                {/* Main list grid */}
                {loading ? (
                  <div className="flex-1 flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                  </div>
                ) : accList.length > 0 ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {accList.map((acc) => (
                        <div key={acc.id} className="h-full">
                          <AccCard
                            acc={acc}
                            userLevel={userLevel}
                            onBuySuccess={() => {
                              // Reload current page list to reflect status updates
                              loadAccounts();
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-10">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-600 disabled:opacity-40 font-bold text-xs hover:bg-zinc-50 transition cursor-pointer shadow-sm"
                        >
                          Trước
                        </button>
                        <span className="text-xs font-bold text-zinc-500">
                          Trang {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-600 disabled:opacity-40 font-bold text-xs hover:bg-zinc-50 transition cursor-pointer shadow-sm"
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-zinc-300 text-center shadow-sm">
                    <ShieldAlert className="w-12 h-12 text-zinc-400 mb-3" />
                    <h3 className="text-zinc-800 font-extrabold text-base mb-1">Không tìm thấy tài khoản game</h3>
                    <p className="text-zinc-500 text-xs max-w-xs">
                      Không có tài khoản nào phù hợp với bộ lọc hiện tại của bạn. Vui lòng điều chỉnh khoảng giá hoặc từ khóa tìm kiếm.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dark Footer */}
      <footer className="mt-auto w-full border-t border-[#374669]/20 bg-[#243049] py-8 text-center text-xs text-zinc-400">
        <p className="font-semibold text-zinc-300">© 2026 Shop Thịnh Sáng - Hệ thống nạp game tự động uy tín</p>
        <p className="mt-1 font-light text-zinc-500">Giao diện đã cập nhật logo và banner theo bộ nhận diện mới.</p>
        <div className="mt-3 flex justify-center gap-4 text-[10px] font-semibold text-cyan-400">
          <Link href="/admin/login" className="hover:text-cyan-300">
            Cổng Admin
          </Link>
          <span>•</span>
          <Link href="/profile" className="hover:text-cyan-300">
            Nạp Ví
          </Link>
          <span>•</span>
          <Link href="/history" className="hover:text-cyan-300">
            Lịch Sử
          </Link>
        </div>
      </footer>
    </div>
  );
}
