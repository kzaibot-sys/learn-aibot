'use client';

import { create } from 'zustand';
import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  add: (type: 'success' | 'error', message: string) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export function toast(type: 'success' | 'error', message: string) {
  useToastStore.getState().add(type, message);
}

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const remove = useToastStore(s => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-right ${
            t.type === 'success'
              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}
        >
          {t.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {t.message}
          <button onClick={() => remove(t.id)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
