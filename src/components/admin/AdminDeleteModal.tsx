import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface AdminDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemTypeLabel?: string;
  description?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isDark: boolean;
}

export const AdminDeleteModal: React.FC<AdminDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  itemTypeLabel,
  description,
  isDeleting = false,
  onConfirm,
  onClose,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        id="admin-delete-modal"
        className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-start space-x-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isDark ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-rose-100 text-rose-600 border border-rose-200'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold tracking-tight">
                {title}
              </h3>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className={`p-1 rounded-lg transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {description ? (
              <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {description}
              </p>
            ) : (
              <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Bạn có chắc chắn muốn xóa {itemTypeLabel || ''}{' '}
                <strong className={isDark ? 'text-rose-300' : 'text-rose-700'}>
                  "{itemName}"
                </strong>{' '}
                khỏi hệ thống Firebase Firestore? Hành động này sẽ được ghi nhận vào lịch sử quản trị và không thể hoàn tác.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            Hủy bỏ
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-rose-600/20 active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
