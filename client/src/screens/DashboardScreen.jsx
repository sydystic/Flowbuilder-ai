/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SettingsModal from '../components/modals/SettingsModal';
import NotificationsModal from '../components/modals/NotificationsModal';
import ProfileModal from '../components/modals/ProfileModal';

const getWorkflowIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('mail') || lower.includes('gmail') || lower.includes('email')) return 'mail';
  if (lower.includes('sheet') || lower.includes('table') || lower.includes('excel')) return 'table_chart';
  if (lower.includes('slack') || lower.includes('discord') || lower.includes('chat')) return 'chat';
  if (lower.includes('database') || lower.includes('postgres') || lower.includes('sql') || lower.includes('db')) return 'database';
  if (lower.includes('webhook') || lower.includes('api') || lower.includes('http')) return 'lan';
  if (lower.includes('sync') || lower.includes('transfer')) return 'sync';
  return 'data_object';
};

export default function DashboardScreen() {
  const [workflows, setWorkflows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, workflowId: null, workflowName: '' });
  const [deletingIds, setDeletingIds] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/workflows');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setWorkflows(data);
    } catch (err) {
      console.error('Failed to fetch workflows', err);
      showToast('Failed to load workflows', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleToggleActive = async (id, currentActive) => {
    const newActive = !currentActive;

    setWorkflows(prev =>
      prev.map(wf => wf.id === id ? { ...wf, active: newActive } : wf)
    );

    try {
      await axios.patch(`/api/workflows/${id}/activate`, { active: newActive });
      showToast(`Workflow ${newActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      setWorkflows(prev =>
        prev.map(wf => wf.id === id ? { ...wf, active: currentActive } : wf)
      );
      const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
      showToast(`Failed to toggle status: ${errorMsg}`, 'error');
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ isOpen: true, workflowId: id, workflowName: name });
  };

  const confirmDelete = async () => {
    const id = deleteModal.workflowId;
    setDeleteModal({ isOpen: false, workflowId: null, workflowName: '' });
    setDeletingIds(prev => [...prev, id]);

    setTimeout(async () => {
      try {
        const res = await axios.delete(`/api/workflows/${id}`);
        if (res.data.success) {
          showToast('Workflow deleted successfully');
          fetchWorkflows();
        } else {
          throw new Error(res.data.error || 'Failed to delete workflow');
        }
      } catch (err) {
        setDeletingIds(prev => prev.filter(dId => dId !== id));
        const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
        showToast(`Error: ${errorMsg}`, 'error');
      }
    }, 200);
  };

  const filteredWorkflows = workflows.filter((wf) =>
    wf.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden">
      <Header
        activeTab="dashboard"
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div className="flex h-full flex-1 overflow-hidden">
        <Sidebar activeTab="dashboard" />

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-sm font-medium text-primary">Workflows</p>
                <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em] text-ink">
                  Workflow Directory
                </h1>
                <p className="mt-2 text-[15px] text-ink-muted">
                  Manage and monitor the automations generated for your n8n workspace.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ink-faint">
                    search
                  </span>
                  <input
                    className="notion-input w-72 pl-9"
                    placeholder="Search workflows..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link to="/" className="notion-button">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  New Workflow
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {isLoading && [1, 2, 3].map((placeholderId) => (
                <div key={placeholderId} className="notion-panel p-5">
                  <div className="h-4 w-28 rounded shimmer-bg" />
                  <div className="mt-5 h-7 w-3/4 rounded shimmer-bg" />
                  <div className="mt-3 h-4 w-1/2 rounded shimmer-bg" />
                  <div className="mt-8 h-9 w-full rounded shimmer-bg" />
                </div>
              ))}

              {!isLoading && filteredWorkflows.length === 0 && (
                <p className="col-span-full rounded-xl bg-white/40 py-12 text-center text-sm text-ink-muted">
                  {searchQuery ? 'No workflows match your search query.' : 'No workflows built yet.'}
                </p>
              )}

              {!isLoading && filteredWorkflows.map((wf) => {
                const icon = getWorkflowIcon(wf.name);
                const isDeleting = deletingIds.includes(wf.id);
                return (
                  <article
                    key={wf.id}
                    className={`notion-panel p-5 transition-all hover:bg-white/70 ${
                      isDeleting ? 'opacity-0 scale-95 duration-300 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-primary">
                        <span className="material-symbols-outlined text-[22px]">{icon}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          wf.active ? 'bg-primary/10 text-primary' : 'bg-black/[0.05] text-ink-muted'
                        }`}>
                          {wf.active ? 'Active' : 'Inactive'}
                        </span>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={!!wf.active}
                            onChange={() => handleToggleActive(wf.id, wf.active)}
                            className="peer sr-only"
                          />
                          <span className="h-5 w-9 rounded-full bg-black/10 transition-colors peer-checked:bg-primary" />
                          <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                        </label>
                      </div>
                    </div>

                    <h3 className="mt-5 truncate text-[19px] font-semibold tracking-[-0.01em] text-ink">
                      {wf.name}
                    </h3>
                    <p className="mt-1 truncate text-sm text-ink-muted">ID: {wf.id}</p>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-ink-faint">Nodes</p>
                        <p className="mt-1 font-semibold text-ink">{wf.nodes ? wf.nodes.length : 0}</p>
                      </div>
                      <div>
                        <p className="text-ink-faint">Updated</p>
                        <p className="mt-1 font-semibold text-ink">
                          {wf.updatedAt
                            ? new Date(wf.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2">
                      <a href="http://localhost:5678" target="_blank" rel="noreferrer" className="notion-button-secondary flex-1">
                        <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                        n8n
                      </a>
                      <Link to={`/workflow/${wf.id}`} className="notion-button-secondary flex-1">
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(wf.id, wf.name)}
                        className="notion-button-secondary h-9 w-9 px-0 hover:text-[#93000a]"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="notion-surface w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-ink">Delete Workflow</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Delete <span className="font-semibold text-ink">"{deleteModal.workflowName}"</span>? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteModal({ isOpen: false, workflowId: null, workflowName: '' })}
                className="notion-button-secondary"
                type="button"
              >
                Cancel
              </button>
              <button onClick={confirmDelete} className="notion-button bg-[#93000a] hover:bg-[#7d0008]" type="button">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} showToast={showToast} />
      <NotificationsModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}
