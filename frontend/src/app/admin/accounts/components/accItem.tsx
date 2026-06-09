"use client";

import React, { useState } from 'react';
import { Trash2, Maximize2, Edit, X } from 'lucide-react';
import { adminApi } from '../../adminApi';

interface AccItemProps {
  acc: any;
  onDelete?: (id: string) => void;
  onEdit?: (acc: any) => void;
}

export default function AccItem({ acc, onDelete, onEdit }: AccItemProps) {
  const [status, setStatus] = useState(acc.status);
  const [showModal, setShowModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa tài khoản này không?")) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteAccount(acc.id);
      if (onDelete) onDelete(acc.id);
    } catch (error) {
      console.error("Lỗi khi xóa account:", error);
      alert("Không thể xóa tài khoản!");
    } finally {
      setDeleteLoading(false);
    }
  };

  const isSold = status === 'sold';

  return (
    <>
      <div className={`
        group relative w-full h-full flex flex-col
        bg-[#1e293b]/40 border border-white/5 rounded-2xl overflow-hidden
        hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10
        transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm
      `}>
        {/* Image Section */}
        <div className="relative aspect-[16/9] overflow-hidden bg-[#0f172a]/40">
          {acc.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={acc.image}
              alt={`Acc #${acc.id}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
              <span className="text-4xl">🎮</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className={`
              px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm border
              ${isSold
                ? "bg-zinc-800/80 text-zinc-500 border-zinc-700"
                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"}
            `}>
              {isSold ? "Đã bán" : "Có sẵn"}
            </span>
          </div>

          {/* ID Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-[#0f172a]/80 backdrop-blur-md text-zinc-200 text-[10px] font-mono font-bold px-2 py-1 rounded-lg border border-white/5 shadow-sm">
              #{acc.id}
            </span>
          </div>

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1.5px]">
            <button
              onClick={() => setShowModal(true)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white shadow-lg hover:scale-110 transition-all border border-white/10"
              title="Xem ảnh lớn"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            {/* Price */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {Number(acc.price).toLocaleString('vi-VN')}
                <span className="text-xs text-zinc-400 font-medium ml-1">₫</span>
              </div>
            </div>

            <div className="w-full h-px bg-white/5 mb-3"></div>

            {/* Info Text */}
            <p className="text-xs font-semibold text-zinc-400 leading-relaxed line-clamp-3 mb-4">
              {acc.info}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onEdit && onEdit(acc)}
              className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white py-2 rounded-xl text-xs font-bold transition-all border border-white/5"
            >
              <Edit className="w-3.5 h-3.5" /> Sửa
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-2 rounded-xl text-xs font-bold transition-all border border-rose-500/10"
            >
              {deleteLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Modal Image Zoom */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setShowModal(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={acc.image}
            alt="acc full"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
            onClick={() => setShowModal(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}
