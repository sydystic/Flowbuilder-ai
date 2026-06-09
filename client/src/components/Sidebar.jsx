import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Sidebar({ activeTab }) {
  const [recentWorkflows, setRecentWorkflows] = useState([]);

  useEffect(() => {
    fetchRecentWorkflows();
    // Refresh every 30s to keep sync with dashboard deployments
    const interval = setInterval(fetchRecentWorkflows, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentWorkflows = async () => {
    try {
      const res = await axios.get('/api/workflows');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setRecentWorkflows(data.slice(0, 8));
    } catch (e) {
      console.warn('Failed to load recent workflows in sidebar', e.message);
    }
  };

  return (
    <aside className="w-[260px] h-full glass-sidebar flex flex-col py-6 px-4 gap-6 overflow-y-auto flex-shrink-0 z-20">
      <div className="flex items-center gap-3 mb-2 px-1">
        <div className="p-2 bg-primary/10 rounded-lg">
          <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
        </div>
        <div>
          <div className="font-headline-md text-[14px] leading-tight text-on-surface font-bold">Flow Engine</div>
          <div className="font-label-md text-[11px] text-green-400 flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            v2.4.0 Active
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-label-md font-label-md transition-all ${
            activeTab === 'chat'
              ? 'bg-white/10 text-white font-bold border border-white/10'
              : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
          }`}
          to="/"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          Chat Builder
        </Link>
        <Link
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-label-md font-label-md transition-all ${
            activeTab === 'dashboard'
              ? 'bg-white/10 text-white font-bold border border-white/10'
              : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
          }`}
          to="/dashboard"
        >
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
          Workflows
        </Link>
        <Link
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-label-md font-label-md transition-all ${
            activeTab === 'credentials'
              ? 'bg-white/10 text-white font-bold border border-white/10'
              : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
          }`}
          to="/credentials"
        >
          <span className="material-symbols-outlined text-[18px]">key</span>
          Credentials
        </Link>
      </nav>

      {/* Recent Workflows */}
      <div className="mt-2 border-t border-outline-variant/30 pt-4 flex-1">
        <div className="text-[10px] font-bold text-outline uppercase tracking-widest px-2 mb-2">Recent Workflows</div>
        <div className="space-y-0.5 max-h-[250px] overflow-y-auto custom-scrollbar">
          {recentWorkflows.map(wf => (
            <Link
              key={wf.id}
              to={`/workflow/${wf.id}`}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/5 transition-all text-on-surface-variant hover:text-on-surface"
            >
              <span className="font-label-md text-[11px] truncate flex-1">{wf.name}</span>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ml-2 ${wf.active ? 'bg-green-400' : 'bg-outline-variant'}`} />
            </Link>
          ))}
          {recentWorkflows.length === 0 && (
            <p className="text-[11px] text-on-surface-variant italic px-2">No workflows yet</p>
          )}
        </div>
      </div>

      {/* Bottom links */}
      <div className="mt-auto pt-4 border-t border-outline-variant/30 space-y-0.5 flex-shrink-0">
        <a href="http://localhost:5678" target="_blank" rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          <span className="font-label-md text-[12px]">View in n8n</span>
        </a>
      </div>
    </aside>
  );
}
