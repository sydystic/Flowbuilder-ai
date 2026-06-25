import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Header({ activeTab, onOpenNotifications }) {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const stored = localStorage.getItem('flowbuilder_notifications');
      const list = stored ? JSON.parse(stored) : [];
      setUnreadCount(list.length);
    };

    updateCount();
    window.addEventListener('flowbuilder_notifications_updated', updateCount);
    return () => window.removeEventListener('flowbuilder_notifications_updated', updateCount);
  }, []);

  const navItems = [
    { to: '/', label: 'Chat', key: 'chat' },
    { to: '/dashboard', label: 'Workflows', key: 'dashboard' },
    { to: '/credentials', label: 'Credentials', key: 'credentials' },
  ];

  const avatarUrl = profile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkWlDbCQnjRS8tZsr_5JP_S3UqPb3KjB55ThqKgI9G17LBBvW9bA7xHncGQe-s2UtATJPfqBbITMBH_j3WXc9GcY5GjdtxlCAarjAuzgi5Q0oZvzyhOYhlYkYIbrs526etpTdW1FAzOKUaM5d44N8P6Iaq2ipUorVOBi2uA8zJNhXIvYOHpM_Qcgkyiu_ctlJt_9okTfAkd0MJHs0zgnTEyI4CwIxggOCvjylNKySUHoSaBRDnFWQybPnXuz72ncNwbQ7zN6TwAIg7';
  const fullName = profile?.full_name || 'User Profile';

  return (
    <header className="h-14 flex items-center px-4 bg-canvas-soft text-ink shrink-0 border-b border-[#e6e6e6]">
      <div className="flex w-[260px] items-center gap-2">
        <img alt="FlowBuilder AI" className="h-7 w-7 rounded-md" src="/favicon.svg" />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">
          FlowBuilder AI
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.key}
            className={`notion-nav-item px-3 py-1.5 text-sm ${
              activeTab === item.key ? 'notion-nav-item-active' : ''
            }`}
            to={item.to}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={onOpenNotifications}
          className="notion-nav-item flex h-8 w-8 items-center justify-center relative"
          title="Notifications"
          type="button"
        >
          <span className="material-symbols-outlined text-[19px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-[#93000a] border-2 border-canvas-soft"></span>
          )}
        </button>
        <Link
          to="/settings"
          className={`notion-nav-item flex h-8 w-8 items-center justify-center ${
            activeTab === 'settings' ? 'notion-nav-item-active' : ''
          }`}
          title="Settings"
        >
          <span className="material-symbols-outlined text-[19px]">settings</span>
        </Link>
        <Link
          to="/account"
          className={`notion-nav-item flex h-8 w-8 items-center justify-center ${
            activeTab === 'account' ? 'notion-nav-item-active' : ''
          }`}
          title="User Profile"
        >
          <img
            className="h-6 w-6 rounded-md object-cover border border-[#e6e6e6]"
            src={avatarUrl}
            alt={fullName}
          />
        </Link>
      </div>
    </header>
  );
}
