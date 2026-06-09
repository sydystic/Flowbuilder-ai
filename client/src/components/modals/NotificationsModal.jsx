import React, { useState } from 'react';

const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'success', title: 'Workflow generated & deployed', desc: 'Sent Slack Message when GitHub issue is urgent', time: '10 mins ago' },
  { id: 2, type: 'info', title: 'Credential connected', desc: 'Slack bot connection has been established successfully.', time: '2 hours ago' },
  { id: 3, type: 'warning', title: 'n8n Execution Limit Alert', desc: 'Your free n8n instance has reached 80% execution limits.', time: '1 day ago' },
  { id: 4, type: 'success', title: 'Automation triggered', desc: 'Daily Good Morning Slack Message triggered successfully.', time: '1 day ago' },
];

export default function NotificationsModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-xl p-6 border border-white/10 bg-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-headline-md font-headline-md text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            Notifications
          </h3>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] font-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="glass-card p-3 rounded-lg border border-white/5 bg-[#13131d]/60 flex items-start gap-3 relative group"
            >
              <div className="mt-0.5">
                {n.type === 'success' && (
                  <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
                )}
                {n.type === 'info' && (
                  <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                )}
                {n.type === 'warning' && (
                  <span className="material-symbols-outlined text-amber-400 text-[18px]">warning</span>
                )}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="text-xs font-bold text-on-surface leading-tight truncate">{n.title}</div>
                <div className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">{n.desc}</div>
                <div className="text-[9px] text-outline mt-1">{n.time}</div>
              </div>
              <button
                onClick={() => handleDismiss(n.id)}
                className="absolute top-2 right-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-outline text-[32px] opacity-40">notifications_off</span>
              <p className="text-xs text-on-surface-variant mt-2">All caught up! No new notifications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
