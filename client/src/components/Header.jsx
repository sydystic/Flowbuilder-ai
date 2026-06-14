import { Link } from 'react-router-dom';

export default function Header({ activeTab, onOpenNotifications, onOpenSettings, onOpenProfile }) {
  const navItems = [
    { to: '/', label: 'Chat', key: 'chat' },
    { to: '/dashboard', label: 'Workflows', key: 'dashboard' },
    { to: '/credentials', label: 'Credentials', key: 'credentials' },
  ];

  return (
    <header className="h-14 flex items-center px-4 bg-canvas-soft text-ink shrink-0">
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
          className="notion-nav-item flex h-8 w-8 items-center justify-center"
          title="Notifications"
          type="button"
        >
          <span className="material-symbols-outlined text-[19px]">notifications</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="notion-nav-item flex h-8 w-8 items-center justify-center"
          title="Settings"
          type="button"
        >
          <span className="material-symbols-outlined text-[19px]">settings</span>
        </button>
        <button
          onClick={onOpenProfile}
          className="notion-nav-item flex h-8 w-8 items-center justify-center"
          title="User Profile"
          type="button"
        >
          <img
            className="h-6 w-6 rounded-md object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkWlDbCQnjRS8tZsr_5JP_S3UqPb3KjB55ThqKgI9G17LBBvW9bA7xHncGQe-s2UtATJPfqBbITMBH_j3WXc9GcY5GjdtxlCAarjAuzgi5Q0oZvzyhOYhlYkYIbrs526etpTdW1FAzOKUaM5d44N8P6Iaq2ipUorVOBi2uA8zJNhXIvYOHpM_Qcgkyiu_ctlJt_9okTfAkd0MJHs0zgnTEyI4CwIxggOCvjylNKySUHoSaBRDnFWQybPnXuz72ncNwbQ7zN6TwAIg7"
            alt="User avatar"
          />
        </button>
      </div>
    </header>
  );
}
