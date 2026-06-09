"use client";

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../adminApi';
import { X, Save, Plus, Image as ImageIcon, Upload } from 'lucide-react';

interface AddAccProps {
  gameList: any[];
  selectedGameId: string;
  onSuccess: (acc: any) => void;
  onClose?: () => void;
  editMode?: boolean;
  accData?: any;
}

export default function AddAcc({
  gameList,
  selectedGameId,
  onSuccess,
  onClose,
  editMode = false,
  accData = null
}: AddAccProps) {
  const [info, setInfo] = useState('');
  const [price, setPrice] = useState('');
  const [gameId, setGameId] = useState(selectedGameId || '');
  const [status, setStatus] = useState('selling');
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editMode && accData) {
      setInfo(accData.info || '');
      setPrice(accData.price || '');
      setGameId(accData.game_id || selectedGameId || '');
      setStatus(accData.status || 'selling');
      if (accData.image) {
        setPreview(accData.image);
      }
    } else {
      setGameId(selectedGameId || '');
    }
  }, [editMode, accData, selectedGameId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Chỉ chấp nhận file ảnh JPG, PNG, GIF hoặc WebP');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.trim()) {
      alert('Vui lòng nhập thông tin mô tả tài khoản!');
      return;
    }
    if (!price || Number(price) <= 0) {
      alert('Vui lòng nhập giá bán hợp lệ!');
      return;
    }
    if (!gameId) {
      alert('Vui lòng chọn một Game!');
      return;
    }
    if (!editMode && !file) {
      alert('Vui lòng tải lên hình ảnh minh họa cho tài khoản!');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(
        'info',
        JSON.stringify({
          game_id: gameId,
          info: info,
          price: Number(price),
          status: status
        })
      );
      if (file) {
        formData.append('image', file);
      }

      const saved = await adminApi.saveAccount(formData, editMode && accData ? accData.id : undefined);
      if (saved) {
        alert(editMode ? 'Cập nhật tài khoản thành công!' : 'Thêm tài khoản mới thành công!');
        onSuccess(saved);
        if (!editMode) {
          setInfo('');
          setPrice('');
          setFile(null);
          setPreview(null);
        }
      } else {
        alert('Có lỗi xảy ra khi lưu tài khoản!');
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/40 flex justify-between items-center">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          {editMode ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              Chỉnh sửa tài khoản #{accData?.id}
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              Thêm tài khoản Game mới
            </>
          )}
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Chọn Game <span className="text-rose-500">*</span></label>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            required
            className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
          >
            <option value="" disabled>-- Chọn Game --</option>
            {gameList.map((g) => (
              <option key={g.id} value={g.id || g.gamecode}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Thông tin mô tả Acc (skin, tướng, rank...) <span className="text-rose-500">*</span></label>
          <textarea
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            rows={4}
            placeholder="Ví dụ: Acc MLBB 80 skin có skin Legend, 5 skin Epic, full tướng..."
            required
            className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition resize-none placeholder-zinc-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Giá bán (₫) <span className="text-rose-500">*</span></label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="100000"
              required
              min="0"
              className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Trạng thái bán</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#0f172a]/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition"
            >
              <option value="selling">Đang bán (Selling)</option>
              <option value="sold">Đã bán (Sold)</option>
            </select>
          </div>
        </div>

        {/* Thumbnail Image upload */}
        <div>
          <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Ảnh chụp tài khoản {!editMode && <span className="text-rose-500">*</span>}</label>
          <div className="border border-dashed border-white/20 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-xl p-6 transition-all text-center cursor-pointer relative group bg-[#0f172a]/30">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {!preview ? (
              <div className="text-zinc-500 group-hover:text-purple-400 transition-colors">
                <div className="p-3 bg-[#0f172a]/60 rounded-full shadow-md inline-block mb-2 border border-white/5">
                  <ImageIcon className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="font-semibold text-sm mb-1 text-zinc-300">Click để chọn hoặc kéo thả ảnh vào đây</div>
                <p className="text-xs text-zinc-500">PNG, JPG, GIF, WEBP</p>
              </div>
            ) : (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="max-h-36 rounded-lg object-contain bg-[#0f172a] p-1 border border-white/10" />
                <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-500/10 py-1 px-3 rounded-full border border-purple-500/20">
                  <Upload className="w-3 h-3" />
                  <span>Thay đổi ảnh</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-semibold rounded-xl text-sm transition"
              disabled={loading}
            >
              Hủy bỏ
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg shadow-purple-500/15 transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                {editMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editMode ? 'Lưu thay đổi' : 'Đăng bán Acc'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
