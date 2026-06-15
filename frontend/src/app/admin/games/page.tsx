"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Edit, ImageIcon, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { adminApi } from "../adminApi";

type AdminGame = {
  id: string;
  name: string;
  gamecode: string;
  thumbnail?: string;
  status?: string;
  api_source?: string;
  api_id?: string;
};

type Notice = {
  tone: "success" | "error" | "info";
  message: string;
};

const fallbackThumbnail = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80";

const noticeStyles: Record<Notice["tone"], string> = {
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  error: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  info: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
};

export default function GameManagement() {
  const [games, setGames] = useState<AdminGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const [editingGame, setEditingGame] = useState<AdminGame | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [modalNotice, setModalNotice] = useState<Notice | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const preview = useMemo(() => {
    if (!thumbnailFile) return thumbnail || "";
    return URL.createObjectURL(thumbnailFile);
  }, [thumbnail, thumbnailFile]);

  useEffect(() => {
    if (!preview.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getGames();
      setGames(list as AdminGame[]);
    } catch (error) {
      console.error(error);
      setNotice({ tone: "error", message: "Không tải được danh sách game." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGames();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredGames = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return games;

    return games.filter((game) => game.name.toLowerCase().includes(keyword) || game.gamecode.toLowerCase().includes(keyword));
  }, [games, search]);

  const handleSync = async () => {
    setSyncing(true);
    setNotice({ tone: "info", message: "Đang đồng bộ game từ Partner API..." });
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api"}/games/sync-nguona`, {
        method: "POST",
        credentials: "include",
      });
      await loadGames();
      setNotice({ tone: "success", message: "Đồng bộ game thành công." });
    } catch (error) {
      console.error(error);
      setNotice({ tone: "error", message: "Đồng bộ game thất bại." });
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (game: AdminGame) => {
    setEditingGame(game);
    setName(game.name);
    setStatus(game.status || "active");
    setThumbnail(game.thumbnail || "");
    setThumbnailFile(null);
    setModalNotice(null);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setEditingGame(null);
    setThumbnailFile(null);
    setModalNotice(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setThumbnailFile(file);
    setModalNotice(file ? { tone: "info", message: `Đã chọn ảnh: ${file.name}` } : null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingGame || saving) return;

    const payload = {
      ...editingGame,
      name,
      status,
      thumbnail,
      thumbnailFile,
    };

    setSaving(true);
    setModalNotice({ tone: "info", message: "Đang lưu thay đổi game..." });

    try {
      const response = await adminApi.saveGame(payload);
      if (response) {
        setNotice({ tone: "success", message: `Đã lưu game "${name}" thành công.` });
        setEditingGame(null);
        setThumbnailFile(null);
        setModalNotice(null);
        await loadGames();
      }
    } catch (error) {
      console.error(error);
      setModalNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Lưu game thất bại.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa game này?")) return;

    try {
      await adminApi.deleteGame(id);
      setNotice({ tone: "success", message: "Đã xóa game thành công." });
      await loadGames();
    } catch (error) {
      console.error(error);
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Xóa game thất bại.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {notice ? (
        <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${noticeStyles[notice.tone]}`}>
          {notice.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{notice.message}</span>
        </div>
      ) : null}

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#1e293b]/40 p-4 shadow-lg backdrop-blur-md sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm game..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 py-2 pl-9 pr-4 text-sm text-white outline-none transition focus:border-purple-500"
          />
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/10 transition active:scale-95 disabled:opacity-50 sm:w-auto"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Đang đồng bộ..." : "Đồng bộ game từ Partner API"}
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-[#1e293b]/40 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-40 bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={game.thumbnail || fallbackThumbnail}
                  alt={game.name}
                  className="h-full w-full object-cover brightness-75 transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                <div className="absolute right-3 top-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      game.status === "active"
                        ? "border border-emerald-500/20 bg-emerald-500/20 text-emerald-300"
                        : "border border-rose-500/20 bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {game.status === "active" ? "Hoạt động" : "Tạm dừng"}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h4 className="text-lg font-bold text-white">{game.name}</h4>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-b border-white/5 pb-4 text-xs text-zinc-400">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Mã Game</p>
                      <p className="mt-0.5 font-mono text-zinc-300">{game.gamecode}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Nguồn API</p>
                      <p className="mt-0.5 uppercase text-zinc-300">{game.api_source || "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Cổng API ID</p>
                      <p className="mt-0.5 truncate font-mono text-zinc-300">{game.api_id || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(game)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(game.id)}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 transition hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingGame ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#1e293b] shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/5 bg-[#0f172a]/40 px-6 py-4">
              <h3 className="text-base font-bold text-white">Chỉnh sửa thông tin Game</h3>
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
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Tên hiển thị Game</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Trạng thái game</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0f172a]/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500"
                >
                  <option value="active">Kích hoạt (Active)</option>
                  <option value="inactive">Tạm dừng (Inactive)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Ảnh nền game</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-white/20 bg-[#0f172a]/30 p-6 text-center transition hover:border-purple-500/50 hover:bg-purple-500/5"
                >
                  {preview ? (
                    <div className="inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="Game preview"
                        className="mx-auto max-h-40 rounded-lg border border-white/10 bg-[#0f172a] object-contain p-1"
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
                      <div className="text-sm font-semibold text-zinc-300">Click để chọn ảnh game</div>
                      <p className="mt-1 text-xs text-zinc-500">PNG, JPG, GIF, WEBP</p>
                    </div>
                  )}
                </button>
                {!thumbnailFile && thumbnail ? <p className="mt-2 text-xs text-zinc-500">Đang dùng ảnh hiện tại trên server.</p> : null}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
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
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
