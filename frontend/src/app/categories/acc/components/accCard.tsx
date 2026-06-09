"use client";

import React, { useState } from 'react';
import { clientApi } from '../../../clientApi';
import {
  Zap,
  ShoppingCart,
  X,
  Eye,
  Shield,
  CheckCircle,
  Star,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';

interface AccCardProps {
  acc: any;
  userLevel: number;
  onBuySuccess?: () => void;
}

export default function AccCard({ acc, userLevel, onBuySuccess }: AccCardProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buying, setBuying] = useState(false);

  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    zalo: '',
    note: ''
  });

  // Calculate price based on user tier level
  const getFinalPrice = () => {
    const level = Number(userLevel) || 1;
    let final = acc.price;
    if (level === 2 && acc.price_pro) final = acc.price_pro;
    if (level === 3 && acc.price_plus) final = acc.price_plus;
    if (level === 1 && acc.price_basic) final = acc.price_basic;
    return parseInt(final);
  };

  const finalPrice = getFinalPrice();
  const originalPrice = parseInt(acc.price);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!contactInfo.phone.trim() || !contactInfo.email.trim() || !contactInfo.zalo.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin số điện thoại, email/facebook và Zalo liên hệ!');
      return;
    }

    const payload = {
      acc_id: String(acc.id),
      contact_info: {
        phone: contactInfo.phone,
        email: contactInfo.email,
        zalo: contactInfo.zalo,
        note: contactInfo.note || ''
      }
    };

    setBuying(true);
    try {
      const res = await clientApi.buyAccount(payload);
      if (res && res.success) {
        alert('Đặt mua tài khoản thành công! Admin sẽ bàn giao thông tin đăng nhập sớm.');
        setShowBuyModal(false);
        setContactInfo({ phone: '', email: '', zalo: '', note: '' });
        if (onBuySuccess) onBuySuccess();
      } else {
        alert(res.message || 'Đặt mua thất bại!');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Mua tài khoản thất bại! Vui lòng kiểm tra lại số dư ví.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      <div className="group bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-300 overflow-hidden flex flex-col relative">
        {/* Thumbnail Image */}
        <div className="relative aspect-video bg-zinc-100 overflow-hidden">
          {acc.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={acc.image}
                alt={`Acc #${acc.id}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80";
                }}
              />
              {/* Overlay quick view */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  onClick={() => setShowImageModal(true)}
                  className="bg-white text-zinc-900 hover:bg-purple-600 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Eye size={15} /> Xem ảnh lớn
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold text-xs bg-zinc-50">
              CHƯA CÓ ẢNH
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-zinc-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm border border-zinc-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            #{acc.id}
          </div>

          {finalPrice < originalPrice && (
            <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-lg">
              GIẢM {Math.round((1 - finalPrice / originalPrice) * 100)}%
            </div>
          )}
        </div>

        {/* Content detail */}
        <div className="p-5 flex flex-col flex-1 gap-3 text-left">
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-extrabold text-zinc-900 leading-tight line-clamp-2 text-sm flex-1">
              {acc.info || `Tài khoản game #${acc.id}`}
            </h4>
            <div className="shrink-0 flex items-center justify-center bg-purple-50 text-purple-600 w-7 h-7 rounded-lg">
              <Star size={14} className="fill-purple-600/10" />
            </div>
          </div>

          {/* Verified tag */}
          <div className="flex items-center gap-3 py-2 border-y border-dashed border-zinc-150">
            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> Đã kiểm duyệt
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
              <CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Bàn giao nhanh
            </div>
          </div>

          {/* Pricing & Buy Button */}
          <div className="mt-auto flex items-center justify-between pt-2">
            <div>
              <p className="text-xl font-black text-purple-600">
                {finalPrice.toLocaleString('vi-VN')}
                <span className="text-[10px] font-bold text-zinc-400 align-top ml-0.5">đ</span>
              </p>
              {finalPrice < originalPrice && (
                <p className="text-[10px] text-zinc-400 line-through">
                  {originalPrice.toLocaleString('vi-VN')} đ
                </p>
              )}
            </div>

            <button
              onClick={() => setShowBuyModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-md shadow-purple-500/15 cursor-pointer"
              title="Đặt mua ngay"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ZOOM IMAGE MODAL */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setShowImageModal(false)}
        >
          <button
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-white transition cursor-pointer border border-white/10"
            onClick={() => setShowImageModal(false)}
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={acc.image}
            alt="acc zoom"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl animate-[scaleUp_0.2s_ease-out] border border-white/10"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80";
            }}
          />
        </div>
      )}

      {/* BUY MODAL */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-[scaleUp_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-150 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-base font-black text-zinc-800 flex items-center gap-2">
                <ShoppingCart className="text-purple-600" />
                Đặt Mua Tài Khoản #{acc.id}
              </h2>
              <button
                onClick={() => setShowBuyModal(false)}
                className="text-zinc-400 hover:text-rose-500 transition cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-left">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold mb-1.5 text-zinc-700">
                  <Phone className="w-3.5 h-3.5 text-purple-600" />
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={contactInfo.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại liên hệ..."
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold mb-1.5 text-zinc-700">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  Email hoặc Facebook Link <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="email"
                  value={contactInfo.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email hoặc link facebook..."
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold mb-1.5 text-zinc-700">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  Số Zalo liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="zalo"
                  value={contactInfo.zalo}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại đăng ký Zalo..."
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold mb-1.5 text-zinc-700">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  Lời nhắn thêm cho Admin
                </label>
                <textarea
                  name="note"
                  value={contactInfo.note}
                  onChange={handleChange}
                  placeholder="Nhập lời nhắn của bạn (nếu có)..."
                  rows={2}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all font-semibold resize-none"
                />
              </div>

              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 flex justify-between items-center text-xs font-bold text-purple-900 mt-2">
                <span>Tổng tiền:</span>
                <span className="text-base text-purple-600 font-black">{finalPrice.toLocaleString('vi-VN')}đ</span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={buying}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {buying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Xác nhận thanh toán mua Acc
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
