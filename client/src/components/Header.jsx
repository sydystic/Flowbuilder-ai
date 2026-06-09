import React from 'react';
import { Link } from 'react-router-dom';

export default function Header({ activeTab, onOpenSettings, onOpenNotifications, onOpenProfile }) {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-[#080810]/40 px-margin-desktop backdrop-blur-md">
      <div className="flex items-center gap-4">
        <img alt="FlowBuilder AI" className="h-8 w-8" src="/favicon.svg" />
        <span className="font-headline-md text-headline-md text-on-surface font-bold">
          FlowBuilder AI
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        <nav className="flex gap-1 bg-surface-container-high/30 p-1 rounded-lg border border-outline-variant/10">
          <Link
            className={`font-label-md px-3 py-1.5 rounded transition-all ${
              activeTab === 'chat'
                ? 'bg-primary text-on-primary font-bold shadow-md'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
            to="/"
          >
            Chat
          </Link>
          <Link
            className={`font-label-md px-3 py-1.5 rounded transition-all ${
              activeTab === 'dashboard'
                ? 'bg-primary text-on-primary font-bold shadow-md'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
            to="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className={`font-label-md px-3 py-1.5 rounded transition-all ${
              activeTab === 'credentials'
                ? 'bg-primary text-on-primary font-bold shadow-md'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
            to="/credentials"
          >
            Credentials
          </Link>
        </nav>
        
        <div className="h-8 w-px bg-outline-variant" />
        
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNotifications}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded transition-all relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse border border-background" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded transition-all"
            title="Settings"
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </button>
        </div>
        
        <button
          onClick={onOpenProfile}
          className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-outline-variant hover:border-primary transition-colors cursor-pointer"
          title="User Profile"
        >
          <img
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkWlDbCQnjRS8tZsr_5JP_S3UqPb3KjB55ThqKgI9G17LBBvW9bA7xHncGQe-s2UtATJPfqBbITMBH_j3WXc9GcY5GjdtxlCAarjAuzgi5Q0oZvzyhOYhlYkYIbrs526etpTdW1FAzOKUaM5d44N8P6Iaq2ipUorVOBi2uA8zJNhXIvYOHpM_Qcgkyiu_ctlJt_9okTfAkd0MJHs0zgnTEyI4CwIxggOCvjylNKySUHoSaBRDnFWQybPnXuz72ncNwbQ7zN6TwAIg7"
            alt="User avatar"
          />
        </button>
      </div>
    </header>
  );
}
