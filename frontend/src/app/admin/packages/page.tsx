"use client";

import React, { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';
import { Package, Search, Plus, Edit, Trash2, X, RefreshCw, Percent, DollarSign } from 'lucide-react';

export default function PackageManagement() {
  const [games, setGames] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals / Edit state
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [packageName, setPackageName] = useState('');
  const [gameId, setGameId] = useState('');
  const [apiId, setApiId] = useState('');
  const [apiPrice, setApiPrice] = useState(0);
  const [thumbnail, setThumbnail] = useState('');
  
  // Selling Prices Tiers
  const [markupPercent, setMarkupPercent] = useState(15);
  const [priceBasic, setPriceBasic] = useState(0);
  const [pricePro, setPricePro] = useState(0);
  const [pricePlus, setPricePlus] = useState(0);
  
  const [packageType, setPackageType] = useState('Diamonds');
  const [status, setStatus] = useState('active');

  const loadData = async () => {
    setLoading(true);
    try {
      const [gList, pList] = await Promise.all([
        adminApi.getGames(),
        adminApi.getPackages()
      ]);
      setGames(gList);
      setPackages(pList);
      if (gList.length > 0 && selectedGameId === 'all') {
        setSelectedGameId(gList[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate price tiers based on cost price (apiPrice) and markup percent
  const applyMarkupPercent = (cost: number, pct: number) => {
    const markup = pct / 100;
    const basic = Math.round(cost * (1 + markup));
    const pro = Math.round(cost * (1 + markup - 0.04)); // 4% off basic for Pro
    const plus = Math.round(cost * (1 + markup - 0.08)); // 8% off basic for Plus
    
    setPriceBasic(basic);
    setPricePro(pro);
    setPricePlus(plus);
  };

  const handleEdit = (pkg: any) => {
    setEditingPkg(pkg);
    setPackageName(pkg.package_name);
    setGameId(pkg.game_id);
    setApiId(pkg.api_id || '');
    setApiPrice(pkg.api_price || 0);
    setThumbnail(pkg.thumbnail || '');
    
    // Estimate markup percent if present or default
    const existingMarkup = pkg.api_price ? Math.round(((pkg.price_basic || pkg.price) - pkg.api_price) / pkg.api_price * 100) : 15;
    setMarkupPercent(existingMarkup);
    
    setPriceBasic(pkg.price_basic || pkg.price);
    setPricePro(pkg.price_pro || Math.round(pkg.price * 0.95));
    setPricePlus(pkg.price_plus || Math.round(pkg.price * 0.90));
    setPackageType(pkg.package_type || 'Diamonds');
    setStatus(pkg.status || 'active');
  };

  const handleAddNew = () => {
    setEditingPkg({ id: '' }); // empty id for creation
    setPackageName('');
    setGameId(selectedGameId !== 'all' ? selectedGameId : (games[0]?.id || ''));
    setApiId('');
    setApiPrice(0);
    setThumbnail('');
    setMarkupPercent(15);
    setPriceBasic(0);
    setPricePro(0);
    setPricePlus(0);
    setPackageType('Diamonds');
    setStatus('active');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;

    const data = {
      ...editingPkg,
      package_name: packageName,
      game_id: gameId,
      api_id: apiId,
      api_price: Number(apiPrice),
      price: Number(priceBasic), // Default selling price is Basic
      price_basic: Number(priceBasic),
      price_pro: Number(pricePro),
      price_plus: Number(pricePlus),
      package_type: packageType,
      thumbnail: thumbnail,
      status: status
    };

    const res = await adminApi.savePackage(data);
    if (res.success) {
      setEditingPkg(null);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa gói nạp này?")) {
      await adminApi.deletePackage(id);
      loadData();
    }
  };

  const filteredPackages = packages.filter(p => {
    const matchesGame = selectedGameId === 'all' || p.game_id === selectedGameId;
    const matchesSearch = p.package_name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    return matchesGame && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1e293b]/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Game filter dropdown */}
          <select 
            value={selectedGameId} 
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="bg-[#0f172a]/50 text-sm rounded-xl border border-white/10 px-4 py-2 text-white outline-none focus:border-purple-500 transition"
          >
            <option value="all">Tất cả game</option>
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          {/* Keyword search input */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm tên gói..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f172a]/50 pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 outline-none focus:border-purple-500 transition text-white"
            />
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg shadow-purple-500/10 transition transform active:scale-95"
        >
          <Plus className="w-4.5 h-4.5" />
          Thêm gói nạp mới
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-400">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        /* Packages List Table */
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0f172a]/30 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">Tên gói nạp</th>
                  <th className="px-6 py-4">Loại / ID API</th>
                  <th className="px-6 py-4">Giá gốc (Giá nhập)</th>
                  <th className="px-6 py-4">Giá bán (Basic / Pro / Plus)</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-zinc-500">
                      Không tìm thấy gói nạp nào. Click "Thêm gói nạp mới" để tạo.
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => {
                    const gameName = games.find(g => g.id === pkg.game_id)?.name || 'Unknown Game';
                    return (
                      <tr key={pkg.id} className="hover:bg-white/[0.02] transition duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {pkg.thumbnail ? (
                                <img src={pkg.thumbnail} alt={pkg.package_name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-purple-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{pkg.package_name}</div>
                              <div className="text-zinc-500 text-xs mt-0.5">{gameName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-zinc-400 block">{pkg.package_type}</span>
                          <span className="text-zinc-500 text-xs font-mono">ID: {pkg.api_id || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-zinc-300">
                          {Number(pkg.api_price || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-purple-400 font-bold">Basic: {Number(pkg.price_basic || pkg.price).toLocaleString('vi-VN')}đ</span>
                            <span className="text-cyan-400 font-semibold">Pro: {Number(pkg.price_pro || pkg.price).toLocaleString('vi-VN')}đ</span>
                            <span className="text-emerald-400 font-semibold">Plus: {Number(pkg.price_plus || pkg.price).toLocaleString('vi-VN')}đ</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            pkg.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {pkg.status === 'active' ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleEdit(pkg)}
                              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-zinc-300 transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(pkg.id)}
                              className="p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Package Modal */}
      {editingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/40 flex justify-between items-center">
              <h3 className="font-bold text-base text-white">
                {editingPkg.id ? 'Chỉnh sửa gói nạp' : 'Thêm gói nạp mới'}
              </h3>
              <button onClick={() => setEditingPkg(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Tên gói nạp</label>
                <input 
                  type="text" 
                  value={packageName} 
                  onChange={(e) => setPackageName(e.target.value)} 
                  required
                  placeholder="Ví dụ: 86 Diamonds"
                  className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 font-medium">Chọn Game</label>
                  <select 
                    value={gameId} 
                    onChange={(e) => setGameId(e.target.value)}
                    className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                  >
                    {games.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Loại gói (Category)</label>
                  <input 
                    type="text" 
                    value={packageType} 
                    onChange={(e) => setPackageType(e.target.value)} 
                    required
                    placeholder="Ví dụ: Diamonds, UC"
                    className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">ID gói trên API Partner</label>
                  <input 
                    type="text" 
                    value={apiId} 
                    onChange={(e) => setApiId(e.target.value)} 
                    required
                    placeholder="Ví dụ: 10"
                    className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Trạng thái hoạt động</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
                  >
                    <option value="active">Active (Kích hoạt)</option>
                    <option value="inactive">Disabled (Vô hiệu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Đường dẫn ảnh gói nạp (URL)</label>
                <input 
                  type="text" 
                  value={thumbnail} 
                  onChange={(e) => setThumbnail(e.target.value)} 
                  placeholder="Ví dụ: https://example.com/package-image.png"
                  className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition font-mono"
                />
              </div>

              <div className="border-t border-white/5 my-4 pt-4">
                <h4 className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  Cấu hình giá nhập và giá bán ra
                </h4>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Giá gốc (Nhập API)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={apiPrice} 
                        onChange={(e) => {
                          const cost = Number(e.target.value);
                          setApiPrice(cost);
                          applyMarkupPercent(cost, markupPercent);
                        }} 
                        required
                        min="0"
                        className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl pl-4 pr-9 py-2.5 text-sm outline-none focus:border-purple-500 transition font-mono"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-zinc-500 text-xs font-semibold">đ</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Tính giá theo % lãi gốc</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={markupPercent} 
                        onChange={(e) => {
                          const pct = Number(e.target.value);
                          setMarkupPercent(pct);
                          applyMarkupPercent(apiPrice, pct);
                        }} 
                        min="0"
                        max="200"
                        className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl pl-4 pr-9 py-2.5 text-sm outline-none focus:border-purple-500 transition font-mono font-bold text-purple-400"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-purple-400 text-xs font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div>
                    <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Giá Basic (Mặc định)</label>
                    <input 
                      type="number" 
                      value={priceBasic} 
                      onChange={(e) => setPriceBasic(Number(e.target.value))}
                      className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500 transition font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Giá Pro (Cấp 2)</label>
                    <input 
                      type="number" 
                      value={pricePro} 
                      onChange={(e) => setPricePro(Number(e.target.value))}
                      className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500 transition font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Giá Plus (Cấp 3)</label>
                    <input 
                      type="number" 
                      value={pricePlus} 
                      onChange={(e) => setPricePlus(Number(e.target.value))}
                      className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500 transition font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingPkg(null)}
                  className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-semibold rounded-xl text-sm transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm transition"
                >
                  Lưu gói nạp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
