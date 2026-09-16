import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { PromotionCampaign } from '../../types';

interface AdminPromotionsTabProps {
  promotions: PromotionCampaign[];
  isDark: boolean;
  onOpenNewModal: () => void;
  onEditPromotion: (promo: PromotionCampaign) => void;
  onTogglePromotion: (promo: PromotionCampaign) => void;
  onDeletePromotion: (promo: PromotionCampaign) => void;
  onSendToEmailFlow: (promo: PromotionCampaign) => void;
  onToast: (msg: string) => void;
}

export const AdminPromotionsTab: React.FC<AdminPromotionsTabProps> = ({
  promotions,
  isDark,
  onOpenNewModal,
  onEditPromotion,
  onTogglePromotion,
  onDeletePromotion,
  onSendToEmailFlow,
  onToast,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onToast(`Đã sao chép mã voucher: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              ● Firestore Promotions
            </span>
            <span className={`text-xs font-semibold ${textSub}`}>
              {promotions.length} Chiến Dịch Khuyến Mãi
            </span>
          </div>
          <h2 className={`text-xl font-black ${textHeading}`}>
            Quản Lý Chương Trình Khuyến Mãi & Voucher
          </h2>
          <p className={`text-xs mt-0.5 ${textSub}`}>
            Tạo mã giảm giá, giới hạn lượt dùng và đồng bộ trực tiếp vào Firestore cho các luồng email marketing.
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all flex items-center space-x-1.5 shadow-md shadow-orange-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Voucher Mới (Firestore)</span>
        </button>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {promotions.map(promo => (
          <div
            key={promo.id}
            className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                {/* Code Badge */}
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-lg border font-mono font-black text-sm flex items-center space-x-1.5 ${
                    isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-200'
                  }`}>
                    <Tag className="w-3.5 h-3.5" />
                    <span>{promo.code}</span>
                  </span>
                  <button
                    onClick={() => handleCopy(promo.code)}
                    title="Sao chép mã"
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {copiedCode === promo.code ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => onTogglePromotion(promo)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors flex items-center space-x-1 ${
                    promo.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {promo.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{promo.isActive ? 'ĐANG CHẠY' : 'TẠM DỪNG'}</span>
                </button>
              </div>

              <h3 className={`text-base font-bold mb-1.5 ${textHeading}`}>{promo.title}</h3>
              <p className={`text-xs mb-4 ${textSub}`}>{promo.description}</p>

              {/* Promo Values */}
              <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border mb-4 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`text-[10px] font-semibold uppercase ${textSub}`}>Mức Giảm Giá</span>
                  <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {promo.discountType === 'percentage' 
                      ? `${promo.discountValue}%` 
                      : `${promo.discountValue.toLocaleString('vi-VN')} VNĐ`}
                  </p>
                </div>
                <div>
                  <span className={`text-[10px] font-semibold uppercase ${textSub}`}>Lượt Đã Dùng</span>
                  <p className={`text-sm font-bold ${textHeading}`}>
                    {promo.usageCount} / {promo.usageLimit} ({Math.round((promo.usageCount / Math.max(1, promo.usageLimit)) * 100)}%)
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className={`w-full h-1.5 rounded-full overflow-hidden mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${Math.min(100, (promo.usageCount / Math.max(1, promo.usageLimit)) * 100)}%` }}
                />
              </div>

              <div className={`text-[11px] flex items-center space-x-1.5 ${textSub}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Thời hạn: {promo.startDate} đến {promo.endDate}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className={`pt-4 mt-4 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                onClick={() => onSendToEmailFlow(promo)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Đưa vào Email Flow</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onEditPromotion(promo)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Sửa khuyến mãi"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeletePromotion(promo)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                  }`}
                  title="Xóa khuyến mãi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
