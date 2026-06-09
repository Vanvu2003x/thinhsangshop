"use client";

import React, { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';
import { Gamepad2, Edit, Check, X, RefreshCw, Plus, Search, Trash2 } from 'lucide-react';

export default function GameManagement() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals / Edit state
  const [editingGame, setEditingGame] = useState<any>(null);
  const [name, setName] = useState('');
  const [markupPercent, setMarkupPercent] = useState(0);
  const [thumbnail, setThumbnail] = useState('');
  const [status, setStatus] = useState('active');

  const loadGames = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getGames();
      setGames(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    // Simulate API Sync with Partner API
    setTimeout(async () => {
      await loadGames();
      setSyncing(false);
    }, 1500);
  };

  const handleEdit = (game: any) => {
    setEditingGame(game);
    setName(game.name);
    setMarkupPercent(game.origin_markup_percent || 0);
    setThumbnail(game.thumbnail || '');
    setStatus(game.status || 'active');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    const updated = {
      ...editingGame,
      name,
      origin_markup_percent: Number(markupPercent),
      thumbnail,
      status
    };

    const res = await adminApi.saveGame(updated);
    if (res.success) {
      setEditingGame(null);
      loadGames();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa game này? Tất cả gói nạp của game cũng sẽ bị ảnh hưởng.")) {
      await adminApi.deleteGame(id);
      loadGames();
    }
  };

  const filteredGames = games.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.gamecode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#1e293b]/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-lg">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm game..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f172a]/50 pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-purple-500 transition text-white"
          />
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg shadow-purple-500/10 transition transform active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Đang đồng bộ...' : 'Đồng bộ Game từ Partner API'}
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-400">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        /* Games Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <div 
              key={game.id} 
              className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Background cover image */}
              <div className="h-40 relative bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={game.thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80"} 
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent"></div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    game.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                  }`}>
                    {game.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
              </div>

              {/* Game details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-lg text-white group-hover:text-purple-400 transition duration-300">{game.name}</h4>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-zinc-400 border-b border-white/5 pb-4 mb-4">
                    <div>
                      <p className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Mã Game</p>
                      <p className="text-zinc-300 mt-0.5 font-mono">{game.gamecode}</p>
                    </div>
                    <div>
                      <p className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Nguồn API</p>
                      <p className="text-zinc-300 mt-0.5 uppercase">{game.api_source}</p>
                    </div>
                    <div>
                      <p className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Gốc tăng thêm (%)</p>
                      <p className="text-purple-400 font-bold mt-0.5">+{game.origin_markup_percent || 0}%</p>
                    </div>
                    <div>
                      <p className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Cổng API ID</p>
                      <p className="text-zinc-300 mt-0.5 font-mono truncate">{game.api_id || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(game)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Chỉnh sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(game.id)}
                    className="p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Game Modal */}
      {editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/40 flex justify-between items-center">
              <h3 className="font-bold text-base text-white">Chỉnh sửa thông tin Game</h3>
              <button onClick={() => setEditingGame(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Tên hiển thị Game</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Phần trăm tăng bán lẻ (%)</label>
                  <input 
                    type="number" 
                    value={markupPercent} 
                    onChange={(e) => setMarkupPercent(Number(e.target.value))} 
                    required
                    min="0"
                    max="100"
                    className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Trạng thái game</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                  >
                    <option value="active">Kích hoạt (Active)</option>
                    <option value="inactive">Tạm dừng (Inactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Đường dẫn ảnh nền Game (URL)</label>
                <input 
                  type="text" 
                  value={thumbnail} 
                  onChange={(e) => setThumbnail(e.target.value)} 
                  className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingGame(null)}
                  className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-semibold rounded-xl text-sm transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm transition"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
