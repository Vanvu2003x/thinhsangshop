"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "../adminApi";
import { resolvePackageThumbnail } from "../../packageArt";
import { DollarSign, Edit, Package, Plus, Search, Trash2, X } from "lucide-react";

export default function PackageManagement() {
  const [games, setGames] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [packageName, setPackageName] = useState("");
  const [gameId, setGameId] = useState("");
  const [apiId, setApiId] = useState("");
  const [apiPrice, setApiPrice] = useState(0);
  const [thumbnail, setThumbnail] = useState("");
  const [markupPercent, setMarkupPercent] = useState(15);
  const [priceBasic, setPriceBasic] = useState(0);
  const [pricePro, setPricePro] = useState(0);
  const [pricePlus, setPricePlus] = useState(0);
  const [packageType, setPackageType] = useState("Diamonds");
  const [status, setStatus] = useState("active");

  const loadData = async () => {
    setLoading(true);
    try {
      const [gList, pList] = await Promise.all([adminApi.getGames(), adminApi.getPackages()]);
      setGames(gList);
      setPackages(pList);
      if (gList.length > 0 && selectedGameId === "all") {
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

  const applyMarkupPercent = (cost: number, pct: number) => {
    const markup = pct / 100;
    const basic = Math.round(cost * (1 + markup));
    const pro = Math.round(cost * (1 + markup - 0.04));
    const plus = Math.round(cost * (1 + markup - 0.08));

    setPriceBasic(basic);
    setPricePro(pro);
    setPricePlus(plus);
  };

  const handleEdit = (pkg: any) => {
    setEditingPkg(pkg);
    setPackageName(pkg.package_name);
    setGameId(pkg.game_id);
    setApiId(pkg.api_id || "");
    setApiPrice(pkg.api_price || 0);
    setThumbnail(pkg.thumbnail || "");

    const existingMarkup = pkg.api_price
      ? Math.round((((pkg.price_basic || pkg.price) - pkg.api_price) / pkg.api_price) * 100)
      : 15;
    setMarkupPercent(existingMarkup);

    setPriceBasic(pkg.price_basic || pkg.price);
    setPricePro(pkg.price_pro || Math.round(pkg.price * 0.95));
    setPricePlus(pkg.price_plus || Math.round(pkg.price * 0.9));
    setPackageType(pkg.package_type || "Diamonds");
    setStatus(pkg.status || "active");
  };

  const handleAddNew = () => {
    setEditingPkg({ id: "" });
    setPackageName("");
    setGameId(selectedGameId !== "all" ? selectedGameId : games[0]?.id || "");
    setApiId("");
    setApiPrice(0);
    setThumbnail("");
    setMarkupPercent(15);
    setPriceBasic(0);
    setPricePro(0);
    setPricePlus(0);
    setPackageType("Diamonds");
    setStatus("active");
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
      price: Number(priceBasic),
      price_basic: Number(priceBasic),
      price_pro: Number(pricePro),
      price_plus: Number(pricePlus),
      package_type: packageType,
      thumbnail,
      status,
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

  const filteredPackages = packages.filter((pkg) => {
    const matchesGame = selectedGameId === "all" || pkg.game_id === selectedGameId;
    const matchesSearch =
      pkg.package_name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.id.toLowerCase().includes(search.toLowerCase());
    return matchesGame && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#1e293b]/40 p-4 shadow-lg backdrop-blur-md md:flex-row">
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2 text-sm text-white outline-none transition focus:border-purple-500"
          >
            <option value="all">Tất cả game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm tên gói..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 py-2 pl-9 pr-4 text-sm text-white outline-none transition focus:border-purple-500"
            />
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/10 transition active:scale-95 md:w-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          Thêm gói nạp mới
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#1e293b]/40 shadow-xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0f172a]/30 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="px-6 py-4">Tên gói nạp</th>
                  <th className="px-6 py-4">Loại / ID API</th>
                  <th className="px-6 py-4">Giá gốc</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-500">
                      Không tìm thấy gói nạp nào. Hãy thêm gói mới để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => {
                    const game = games.find((g) => g.id === pkg.game_id);
                    const gameName = game?.name || "Unknown Game";
                    const thumb = resolvePackageThumbnail(game, pkg);

                    return (
                      <tr key={pkg.id} className="transition duration-150 hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-zinc-800 p-1">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt={pkg.package_name} className="h-full w-full object-contain" />
                              ) : (
                                <Package className="h-5 w-5 text-purple-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{pkg.package_name}</div>
                              <div className="mt-0.5 text-xs text-zinc-500">{gameName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="block text-zinc-400">{pkg.package_type}</span>
                          <span className="text-xs font-mono text-zinc-500">ID: {pkg.api_id || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-zinc-300">
                          {Number(pkg.api_price || 0).toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="font-bold text-purple-400">
                              Basic: {Number(pkg.price_basic || pkg.price).toLocaleString("vi-VN")}đ
                            </span>
                            <span className="font-semibold text-cyan-400">
                              Pro: {Number(pkg.price_pro || pkg.price).toLocaleString("vi-VN")}đ
                            </span>
                            <span className="font-semibold text-emerald-400">
                              Plus: {Number(pkg.price_plus || pkg.price).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              pkg.status === "active"
                                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {pkg.status === "active" ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(pkg)}
                              className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(pkg.id)}
                              className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 transition hover:bg-rose-500/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {editingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#1e293b] shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/5 bg-[#0f172a]/40 px-6 py-4">
              <h3 className="text-base font-bold text-white">
                {editingPkg.id ? "Chỉnh sửa gói nạp" : "Thêm gói nạp mới"}
              </h3>
              <button onClick={() => setEditingPkg(null)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Tên gói nạp
                </label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  required
                  placeholder="Ví dụ: 86 Diamonds"
                  className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Chọn Game
                  </label>
                  <select
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500"
                  >
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Loại gói
                  </label>
                  <input
                    type="text"
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    required
                    placeholder="Ví dụ: Diamonds, Pass"
                    className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    ID gói API
                  </label>
                  <input
                    type="text"
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    required
                    placeholder="Ví dụ: 10"
                    className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 font-mono text-sm text-white outline-none transition focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Trạng thái
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500"
                  >
                    <option value="active">Active (Kích hoạt)</option>
                    <option value="inactive">Disabled (Vô hiệu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Đường dẫn ảnh gói nạp
                </label>
                <input
                  type="text"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="Ví dụ: https://example.com/package-image.png"
                  className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 font-mono text-sm text-white outline-none transition focus:border-purple-500"
                />
              </div>

              <div className="my-4 border-t border-white/5 pt-4">
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  <DollarSign className="h-4 w-4 text-purple-400" />
                  Cấu hình giá nhập và giá bán
                </h4>

                <div className="grid grid-cols-2 items-end gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Giá gốc
                    </label>
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
                        className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 py-2.5 pl-4 pr-9 font-mono text-sm text-white outline-none transition focus:border-purple-500"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-zinc-500">đ</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      % lãi gốc
                    </label>
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
                        className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 py-2.5 pl-4 pr-9 font-mono text-sm font-bold text-purple-400 outline-none transition focus:border-purple-500"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-purple-400">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Giá Basic
                    </label>
                    <input
                      type="number"
                      value={priceBasic}
                      onChange={(e) => setPriceBasic(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-3 py-2 font-mono text-xs font-bold text-white outline-none transition focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Giá Pro
                    </label>
                    <input
                      type="number"
                      value={pricePro}
                      onChange={(e) => setPricePro(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-3 py-2 font-mono text-xs font-semibold text-white outline-none transition focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Giá Plus
                    </label>
                    <input
                      type="number"
                      value={pricePlus}
                      onChange={(e) => setPricePlus(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-3 py-2 font-mono text-xs font-semibold text-white outline-none transition focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPkg(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-cyan-500"
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
