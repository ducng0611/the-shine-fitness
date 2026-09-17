import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X } from 'lucide-react';
import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-[10000] flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="text-emerald-500" size={20} />
          </div>
          <div className="flex-1 pr-4">
            <h4 className="text-sm font-bold">Thành công / Success</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 self-start p-1 -mt-1 -mr-1">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
