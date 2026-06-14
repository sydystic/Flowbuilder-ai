import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function Sidebar({ activeTab }) {
  const { data: workflows = [], isLoading, error } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await axios.get('/api/workflows');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const navItems = [
    { to: '/', key: 'chat', icon: 'auto_awesome', label: 'Chat Builder' },
    { to: '/dashboard', key: 'dashboard', icon: 'account_tree', label: 'Workflows' },
    { to: '/credentials', key: 'credentials', icon: 'key', label: 'Credentials' },
  ];

  // Slice to get top 5 recent workflows
  const recentWorkflows = workflows.slice(0, 5);

  return (
    <aside className="notion-sidebar w-[260px] h-full flex flex-col px-3 py-3 gap-5 overflow-y-auto flex-shrink-0">
      <div className="px-2 pt-1">
        <p className="text-[13px] font-semibold text-ink">Workspace</p>
        <p className="mt-0.5 text-xs text-ink-muted">Flow automation studio</p>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.key}
            className={`notion-nav-item flex items-center gap-2 px-2.5 py-1.5 text-sm ${
              activeTab === item.key ? 'notion-nav-item-active' : ''
            }`}
            to={item.to}
          >
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-2">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Recent workflows
        </p>
        <div className="space-y-0.5">
          {isLoading && (
            <div className="space-y-2 py-1">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-4 rounded bg-black/[0.05] shimmer-bg w-full" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <p className="px-2 py-1 text-xs text-[#93000a]">Failed to load</p>
          )}

          {!isLoading && !error && recentWorkflows.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-ink-faint">No workflows yet</p>
          )}

          {!isLoading && !error && recentWorkflows.map((wf) => (
            <Link
              key={wf.id}
              to={`/workflow/${wf.id}`}
              className="notion-nav-item flex items-center gap-2 px-2 py-1.5 text-sm"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${wf.active ? 'bg-primary' : 'bg-ink-faint/50'}`} />
              <span className="truncate">{wf.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto px-2 pb-1">
        <a
          href="http://localhost:5678"
          target="_blank"
          rel="noreferrer"
          className="notion-nav-item flex items-center gap-2 px-2.5 py-1.5 text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          Open n8n
        </a>
      </div>
    </aside>
  );
}

