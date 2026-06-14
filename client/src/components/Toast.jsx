import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  const iconClass = type === 'error' ? 'text-[#93000a]' : 'text-primary';

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-ink shadow-[0_8px_28px_rgba(0,0,0,0.08)]">
      <span className={`material-symbols-outlined text-[18px] ${iconClass}`}>{icon}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="notion-nav-item ml-1 flex h-6 w-6 items-center justify-center" type="button">
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
