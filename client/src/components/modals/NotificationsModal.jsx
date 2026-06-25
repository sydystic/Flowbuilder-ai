import { useState, useEffect } from 'react';

export default function NotificationsModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('flowbuilder_notifications');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem('flowbuilder_notifications');
      setNotifications(stored ? JSON.parse(stored) : []);
    };
    
    // Always refresh lists when modal opens
    if (isOpen) {
      handleUpdate();
    }

    window.addEventListener('flowbuilder_notifications_updated', handleUpdate);
    return () => window.removeEventListener('flowbuilder_notifications_updated', handleUpdate);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    localStorage.setItem('flowbuilder_notifications', JSON.stringify([]));
    setNotifications([]);
    window.dispatchEvent(new Event('flowbuilder_notifications_updated'));
  };

  const handleDismiss = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem('flowbuilder_notifications', JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event('flowbuilder_notifications_updated'));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="notion-surface w-full max-w-md p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-ink">Notifications</h3>
            <p className="mt-1 text-sm text-ink-muted">Recent workflow activity.</p>
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button onClick={handleClearAll} className="notion-button-secondary px-2 py-1 text-xs" type="button">
                Clear all
              </button>
            )}
            <button onClick={onClose} className="notion-nav-item flex h-8 w-8 items-center justify-center" type="button">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div className="max-h-[320px] space-y-1 overflow-y-auto">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-black/[0.04]">
              <span className={`material-symbols-outlined mt-0.5 text-[18px] ${n.type === 'warning' ? 'text-[#93000a]' : 'text-primary'}`}>
                {n.type === 'warning' ? 'warning' : n.type === 'info' ? 'info' : 'check_circle'}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-ink">{n.title}</h4>
                <p className="mt-0.5 text-sm leading-5 text-ink-muted">{n.desc}</p>
                <p className="mt-1 text-xs text-ink-faint">{n.time}</p>
              </div>
              <button onClick={() => handleDismiss(n.id)} className="notion-nav-item flex h-7 w-7 items-center justify-center" title="Dismiss" type="button">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="py-10 text-center text-sm text-ink-muted">All caught up. No new notifications.</div>
          )}
        </div>
      </div>
    </div>
  );
}
