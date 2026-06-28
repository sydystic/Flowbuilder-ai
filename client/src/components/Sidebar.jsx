import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export default function Sidebar({ activeTab }) {
  const [searchParams] = useSearchParams();
  const currentChatId = searchParams.get('c');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleteChatModal, setDeleteChatModal] = useState({ isOpen: false, id: null, title: '' });

  // React Query: Fetch config
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await axios.get('/api/config');
      return res.data;
    }
  });

  let n8nBaseUrl = config?.n8nUrl || 'http://localhost:5678';
  if (n8nBaseUrl.includes('://n8n:')) {
    n8nBaseUrl = n8nBaseUrl.replace('://n8n:', `://${window.location.hostname}:`);
  }

  // React Query: Fetch workflows
  const { data: workflows = [], isLoading: isWorkflowsLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await axios.get('/api/workflows');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  // React Query: Fetch chat sessions
  const { data: conversations = [], isLoading: isChatsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await axios.get('/api/chat/sessions');
      return Array.isArray(res.data.sessions) ? res.data.sessions : [];
    }
  });

  const navItems = [
    { to: '/', key: 'chat', icon: 'auto_awesome', label: 'Chat Builder' },
    { to: '/dashboard', key: 'dashboard', icon: 'account_tree', label: 'Workflows' },
    { to: '/credentials', key: 'credentials', icon: 'key', label: 'Credentials' },
  ];

  const recentWorkflows = workflows.slice(0, 5);
  const recentChats = conversations.slice(0, 5);

  const handleDeleteChatClick = (e, id, title) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteChatModal({ isOpen: true, id, title });
  };

  const confirmDeleteChat = async () => {
    try {
      await axios.delete(`/api/chat/sessions/${deleteChatModal.id}`);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (currentChatId === deleteChatModal.id) {
        navigate('/');
      }
      setDeleteChatModal({ isOpen: false, id: null, title: '' });
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

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
              activeTab === item.key && !currentChatId ? 'notion-nav-item-active' : ''
            }`}
            to={item.to}
          >
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Recent Chats Section */}
      <div className="px-2">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Recent chats
          </p>
          <Link
            to="/"
            className="flex h-4 w-4 items-center justify-center rounded text-ink-faint hover:bg-black/[0.05] hover:text-ink"
            title="New Chat"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
          </Link>
        </div>
        
        <div className="space-y-0.5">
          {isChatsLoading && (
            <div className="space-y-2 py-1">
              {[1, 2].map((n) => (
                <div key={n} className="h-4 rounded bg-black/[0.05] shimmer-bg w-full" />
              ))}
            </div>
          )}

          {!isChatsLoading && recentChats.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-ink-faint">No chats yet</p>
          )}

          {!isChatsLoading && recentChats.map((chat) => (
            <Link
              key={chat.id}
              to={`/?c=${chat.id}`}
              className={`notion-nav-item group flex items-center gap-2 px-2 py-1.5 text-sm ${
                currentChatId === chat.id ? 'notion-nav-item-active' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-ink-muted shrink-0">chat_bubble</span>
              <span className="truncate flex-1">{chat.title}</span>
              <button
                onClick={(e) => handleDeleteChatClick(e, chat.id, chat.title)}
                className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-ink-faint hover:bg-black/[0.08] hover:text-[#93000a] transition-all ml-auto shrink-0"
                title="Delete Chat"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Workflows Section */}
      <div className="px-2">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Recent workflows
        </p>
        <div className="space-y-0.5">
          {isWorkflowsLoading && (
            <div className="space-y-2 py-1">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-4 rounded bg-black/[0.05] shimmer-bg w-full" />
              ))}
            </div>
          )}

          {!isWorkflowsLoading && recentWorkflows.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-ink-faint">No workflows yet</p>
          )}

          {!isWorkflowsLoading && recentWorkflows.map((wf) => (
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
          href={n8nBaseUrl}
          target="_blank"
          rel="noreferrer"
          className="notion-nav-item flex items-center gap-2 px-2.5 py-1.5 text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          Open n8n
        </a>
      </div>

      {deleteChatModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="notion-surface w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-ink">Delete Chat</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Delete <span className="font-semibold text-ink">"{deleteChatModal.title}"</span>? This will permanently remove the conversation and its message history.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteChatModal({ isOpen: false, id: null, title: '' })}
                className="notion-button-secondary"
                type="button"
              >
                Cancel
              </button>
              <button onClick={confirmDeleteChat} className="notion-button bg-[#93000a] hover:bg-[#7d0008]" type="button">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

