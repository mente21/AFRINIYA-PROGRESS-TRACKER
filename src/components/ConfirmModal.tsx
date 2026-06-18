import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ConfirmActionData {
  title: string;
  message: string;
  icon?: string;
  color?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

interface ConfirmModalProps {
  action: ConfirmActionData | null;
  onClose: () => void;
}

export default function ConfirmModal({ action, onClose }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {action && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-[#131b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${action.color || 'text-primary'}`}>
                  <span className="material-symbols-outlined text-2xl">{action.icon || 'help'}</span>
                </div>
                <h3 className="text-lg font-display font-bold text-white">{action.title}</h3>
              </div>
              <p className="text-gray-400 font-sans text-sm leading-relaxed mb-6">
                {action.message}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  {action.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    action.onConfirm();
                    onClose();
                  }}
                  className={`px-5 py-2 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg hover:brightness-110 active:scale-95 ${
                    action.color?.includes('red') 
                      ? 'bg-red-500 text-white shadow-red-500/20' 
                      : 'bg-primary text-purple-950 shadow-primary/20'
                  }`}
                >
                  {action.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
