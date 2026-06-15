"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, DollarSign, Edit, ImageIcon, Package, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { adminApi } from "../adminApi";
import { resolvePackageThumbnail } from "../../packageArt";

type AdminGame = {
  id: string;
  name: string;
  profit_percent_basic?: number;
  profit_percent_pro?: number;
  profit_percent_plus?: number;
};

type AdminPackage = {
  id?: string;
  game_id: string;
  package_name: string;
  package_type?: string;
  api_id?: string;
  api_price?: number;
  origin_price?: number;
  price?: number;
  price_basic?: number;
  price_pro?: number;
  price_plus?: number;
  profit_percent_basic?: number;
  profit_percent_pro?: number;
  profit_percent_plus?: number;
  thumbnail?: string;
  status?: string;
};

type Notice = {
  tone: "success" | "error" | "info";
  message: string;
};

const DEFAULT_STATUS = "active";
const DEFAULT_TYPE = "Diamonds";

const noticeStyles: Record<Notice["tone"], string> = {
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  error: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  info: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateSalePrice = (cost: number, percent: number) => Math.ceil(Math.max(0, cost) * (1 + percent / 100));

export default function PackageManagement() {
  const [games, setGames] = useState<AdminGame[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const [editingPkg, setEditingPkg] = useState<AdminPackage | null>(null);
  const [packageName, setPackageName] = useState("");
  const [gameId, setGameId] = useState("");
  const [apiId, setApiId] = useState("");
  const [apiPrice, setApiPrice] = useState(0);
  const [originPrice, setOriginPrice] = useState(0);
  const [profitPercentBasic, setProfitPercentBasic] = useState(0);
  const [profitPercentPro, setProfitPercentPro] = useState(0);
  const [profitPercentPlus, setProfitPercentPlus] = useState(0);
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [packageType, setPackageType] = useState(DEFAULT_TYPE);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [modalNotice, setModalNotice] = useState<Notice | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const previewPriceBasic = calculateSalePrice(originPrice, profitPercentBasic);
  const previewPricePro = calculateSalePrice(originPrice, profitPercentPro);
  const previewPricePlus = calculateSalePrice(originPrice, profitPercentPlus);

  const thumbnailPreview = useMemo(() => {
    if (!thumbnailFile) return thumbnail || "";
    return URL.createObjectURL(thumbnailFile);
  }, [thumbnail, thumbnailFile]);

  useEffect(() => {
    if (!thumbnailPreview.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(thumbnailPreview);
  }, [thumbnailPreview]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gameList, packageList] = await Promise.all([adminApi.getGames(), adminApi.getPackages()]);
      setGames(gameList as AdminGame[]);
      setPackages(packageList as AdminPackage[]);
      if (gameList.length > 0) {
        setSelectedGameId((current) => (current === "all" ? gameList[0].id : current));
      }
    } catch (error) {
      console.error(error);
      setNotice({ tone: "error", message: "Không tải được danh sách gói nạp." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const getGameDefaults = (targetGameId: string) => {
    const game = games.find((item) => item.id === targetGameId);
    return {
      basic: toNumber(game?.profit_percent_basic),
      pro: toNumber(game?.profit_percent_pro),
      plus: toNumber(game?.profit_percent_plus),
    };
  };

  const applyGameDefaults = (targetGameId: string) => {
    const defaults = getGameDefaults(targetGameId);
    setProfitPercentBasic(defaults.basic);
    setProfitPercentPro(defaults.pro);
    setProfitPercentPlus(defaults.plus);
  };

  const resetForm = (targetGameId: string) => {
    setPackageName("");
    setGameId(targetGameId);
    setApiId("");
    setApiPrice(0);
    setOriginPrice(0);
    setThumbnail("");
    setThumbnailFile(null);
    setPackageType(DEFAULT_TYPE);
    setStatus(DEFAULT_STATUS);
    setModalNotice(null);
    applyGameDefaults(targetGameId);
  };

  const handleEdit = (pkg: AdminPackage) => {
    const defaults = getGameDefaults(pkg.game_id);

    setEditingPkg(pkg);
    setPackageName(pkg.package_name || "");
    setGameId(pkg.game_id);
    setApiId(pkg.api_id || "");
    setApiPrice(toNumber(pkg.api_price));
    setOriginPrice(toNumber(pkg.origin_price || pkg.api_price));
    setProfitPercentBasic(toNumber(pkg.profit_percent_basic ?? defaults.basic));
    setProfitPercentPro(toNumber(pkg.profit_percent_pro ?? defaults.pro));
    setProfitPercentPlus(toNumber(pkg.profit_percent_plus ?? defaults.plus));
    setThumbnail(pkg.thumbnail || "");
    setThumbnailFile(null);
    setPackageType(pkg.package_type || DEFAULT_TYPE);
    setStatus(pkg.status || DEFAULT_STATUS);
    setModalNotice(null);
  };

  const handleAddNew = () => {
    const defaultGameId = selectedGameId !== "all" ? selectedGameId : games[0]?.id || "";
    setEditingPkg({ id: "", game_id: defaultGameId, package_name: "" });
    resetForm(defaultGameId);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setEditingPkg(null);
    setThumbnailFile(null);
    setModalNotice(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPkg || saving) return;

    const payload = {
      ...editingPkg,
      package_name: packageName,
      game_id: gameId,
      api_id: apiId,
      api_price: toNumber(apiPrice),
      origin_price: toNumber(originPrice),
      profit_percent_basic: toNumber(profitPercentBasic),
      profit_percent_pro: toNumber(profitPercentPro),
      profit_percent_plus: toNumber(profitPercentPlus),
      package_type: packageType,
      thumbnail,
      thumbnailFile,
      status,
    };

    setSaving(true);
    setModalNotice({ tone: "info", message: "Đang lưu gói nạp..." });

    try {
      const response = await adminApi.savePackage(payload);
      if (response) {
        setNotice({ tone: "success", message: `Đã lưu gói "${packageName}" thành công.` });
        setEditingPkg(null);
        setThumbnailFile(null);
        setModalNotice(null);
        await loadData();
      }
    } catch (error) {
      console.error(error);
      setModalNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Lưu gói nạp thất bại.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa gói nạp này?")) return;

    try {
      await adminApi.deletePackage(id);
      setNotice({ tone: "success", message: "Đã xóa gói nạp thành công." });
      await loadData();
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Xóa gói nạp thất bại.",
      });
    }
  };

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setThumbnailFile(file);
    setModalNotice(file ? { tone: "info", message: `Đã chọn ảnh: ${file.name}` } : null);
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesGame = selectedGameId === "all" || pkg.game_id === selectedGameId;
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      (pkg.package_name || "").toLowerCase().includes(keyword) ||
      (pkg.id || "").toLowerCase().includes(keyword) ||
      (pkg.api_id || "").toLowerCase().includes(keyword);

    return matchesGame && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {notice ? (
        <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${noticeStyles[notice.tone]}`}>
          {notice.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{notice.message}</span>
        </div>
      ) : null}

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#1e293b]/40 p-4 shadow-lg backdrop-blur-md md:flex-row">
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <select
            value={selectedGameId}
            onChange={(event) => setSelectedGameId(event.target.value)}
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
              onChange={(event) => setSearch(event.target.value)}
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
                  <th className="px-6 py-4">Giá API / Vốn</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-500">
                      Không tìm thấy gói nạp nào.
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => {
                    const game = games.find((item) => item.id === pkg.game_id);
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
                              <div className="mt-0.5 text-xs text-zinc-500">{game?.name || "Unknown Game"}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="block text-zinc-400">{pkg.package_type || DEFAULT_TYPE}</span>
                          <span className="text-xs font-mono text-zinc-500">ID: {pkg.api_id || "N/A"}</span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 font-mono text-xs">
                            <span className="font-semibold text-zinc-200">Vốn: {toNumber(pkg.origin_price).toLocaleString("vi-VN")}đ</span>
                            <span className="text-zinc-500">API: {toNumber(pkg.api_price).toLocaleString("vi-VN")}đ</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="font-bold text-purple-400">Basic: {toNumber(pkg.price_basic || pkg.price).toLocaleString("vi-VN")}đ</span>
                            <span className="font-semibold text-cyan-400">Pro: {toNumber(pkg.price_pro || pkg.price).toLocaleString("vi-VN")}đ</span>
                            <span className="font-semibold text-emerald-400">Plus: {toNumber(pkg.price_plus || pkg.price).toLocaleString("vi-VN")}đ</span>
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
                              onClick={() => pkg.id && handleDelete(pkg.id)}
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

      {editingPkg ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#1e293b] shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/5 bg-[#0f172a]/40 px-6 py-4">
              <h3 className="text-base font-bold text-white">{editingPkg.id ? "Chỉnh sửa gói nạp" : "Thêm gói nạp mới"}</h3>
              <button onClick={handleCloseModal} disabled={saving} className="text-zinc-400 hover:text-white disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-6">
              {modalNotice ? (
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${noticeStyles[modalNotice.tone]}`}>
                  {modalNotice.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{modalNotice.message}</span>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Tên gói nạp</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(event) => setPackageName(event.target.value)}
                  required
                  placeholder="Ví dụ: 86 Diamonds"
                  className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Chọn game</label>
                  <select
                    value={gameId}
                    onChange={(event) => {
                      const nextGameId = event.target.value;
                      setGameId(nextGameId);
                      if (!editingPkg.id) {
                        applyGameDefaults(nextGameId);
                      }
                    }}
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
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Loại gói</label>
                  <input
                    type="text"
                    value={packageType}
                    onChange={(event) => setPackageType(event.target.value)}
                    required
                    placeholder="Ví dụ: Diamonds, Pass"
                    className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">ID gói API</label>
                  <input
                    type="text"
                    value={apiId}
                    onChange={(event) => setApiId(event.target.value)}
                    required
                    placeholder="Ví dụ: 10"
                    className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 font-mono text-sm text-white outline-none transition focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Trạng thái</label>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Ảnh gói nạp</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-white/20 bg-[#0f172a]/30 p-6 text-center transition hover:border-purple-500/50 hover:bg-purple-500/5"
                >
                  {thumbnailPreview ? (
                    <div className="inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailPreview}
                        alt="Package preview"
                        className="mx-auto max-h-36 rounded-lg border border-white/10 bg-[#0f172a] object-contain p-1"
                      />
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-300">
                        <Upload className="h-3 w-3" />
                        Thay đổi ảnh
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-500">
                      <div className="mb-2 inline-block rounded-full border border-white/5 bg-[#0f172a]/60 p-3">
                        <ImageIcon className="h-6 w-6 text-zinc-400" />
                      </div>
                      <div className="text-sm font-semibold text-zinc-300">Click để chọn ảnh gói nạp</div>
                      <p className="mt-1 text-xs text-zinc-500">PNG, JPG, GIF, WEBP</p>
                    </div>
                  )}
                </button>
                {!thumbnailFile && thumbnail ? <p className="mt-2 text-xs text-zinc-500">Đang dùng ảnh hiện tại trên server.</p> : null}
              </div>

              <div className="my-4 border-t border-white/5 pt-4">
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  <DollarSign className="h-4 w-4 text-purple-400" />
                  Cấu hình giá nhập và giá bán
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Giá API</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={apiPrice}
                        onChange={(event) => {
                          const nextApiPrice = toNumber(event.target.value);
                          setApiPrice(nextApiPrice);
                          if (!originPrice) {
                            setOriginPrice(nextApiPrice);
                          }
                        }}
                        min="0"
                        className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 py-2.5 pl-4 pr-9 font-mono text-sm text-white outline-none transition focus:border-purple-500"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-zinc-500">đ</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Giá vốn</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={originPrice}
                        onChange={(event) => setOriginPrice(toNumber(event.target.value))}
                        required
                        min="0"
                        className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 py-2.5 pl-4 pr-9 font-mono text-sm font-bold text-white outline-none transition focus:border-purple-500"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-zinc-500">đ</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-[#0f172a]/40 p-3">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">% Basic</label>
                    <input
                      type="number"
                      value={profitPercentBasic}
                      onChange={(event) => setProfitPercentBasic(toNumber(event.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-3 py-2 font-mono text-xs font-bold text-white outline-none transition focus:border-purple-500"
                    />
                    <p className="mt-2 text-[11px] font-semibold text-purple-400">Giá bán: {previewPriceBasic.toLocaleString("vi-VN")}đ</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0f172a]/40 p-3">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">% Pro</label>
                    <input
                      type="number"
                      value={profitPercentPro}
                      onChange={(event) => setProfitPercentPro(toNumber(event.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-3 py-2 font-mono text-xs font-semibold text-white outline-none transition focus:border-purple-500"
                    />
                    <p className="mt-2 text-[11px] font-semibold text-cyan-400">Giá bán: {previewPricePro.toLocaleString("vi-VN")}đ</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0f172a]/40 p-3">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">% Plus</label>
                    <input
                      type="number"
                      value={profitPercentPlus}
                      onChange={(event) => setProfitPercentPlus(toNumber(event.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-3 py-2 font-mono text-xs font-semibold text-white outline-none transition focus:border-purple-500"
                    />
                    <p className="mt-2 text-[11px] font-semibold text-emerald-400">Giá bán: {previewPricePlus.toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu gói nạp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
