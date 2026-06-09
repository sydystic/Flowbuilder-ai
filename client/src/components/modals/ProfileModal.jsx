import React from 'react';

export default function ProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-sm rounded-xl p-6 border border-white/10 bg-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-headline-md font-headline-md text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_circle</span>
            User Account
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-20 w-20 rounded-full border-2 border-primary overflow-hidden shadow-lg shadow-primary/20">
            <img
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkWlDbCQnjRS8tZsr_5JP_S3UqPb3KjB55ThqKgI9G17LBBvW9bA7xHncGQe-s2UtATJPfqBbITMBH_j3WXc9GcY5GjdtxlCAarjAuzgi5Q0oZvzyhOYhlYkYIbrs526etpTdW1FAzOKUaM5d44N8P6Iaq2ipUorVOBi2uA8zJNhXIvYOHpM_Qcgkyiu_ctlJt_9okTfAkd0MJHs0zgnTEyI4CwIxggOCvjylNKySUHoSaBRDnFWQybPnXuz72ncNwbQ7zN6TwAIg7"
              alt="Profile avatar"
            />
          </div>
          <div>
            <h4 className="text-on-surface font-bold text-base leading-tight">Siddharth Kurne</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">siddharth@example.com</p>
            <div className="mt-2.5 inline-block badge-active px-3 py-1 rounded-full text-[10px] font-bold">
              Developer Pro Plan
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-outline-variant/30 pt-5 space-y-4">
          <div>
            <div className="flex justify-between text-xs text-on-surface-variant mb-1 font-medium">
              <span>Workflows Deployed</span>
              <span className="text-on-surface">4 / 25</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div className="bg-primary h-full rounded-full" style={{ width: '16%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-on-surface-variant mb-1 font-medium">
              <span>API Execution Quota</span>
              <span className="text-on-surface">1,420 / 10,000</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div className="bg-primary h-full rounded-full" style={{ width: '14.2%' }} />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-outline-variant/30 flex justify-end">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg border border-white/10 text-xs text-on-surface hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
