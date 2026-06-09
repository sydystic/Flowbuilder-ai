import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg glass-card border border-white/10 pointer-events-auto bg-white/5 backdrop-blur-md shadow-2xl">
      <span className={`material-symbols-outlined ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isSuccess ? 'check_circle' : 'error'}
      </span>
      <span className="text-sm font-medium text-[#e5e2e1]">{message}</span>
      <button onClick={onClose} className="ml-2 text-outline hover:text-[#e5e2e1] transition-colors">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
