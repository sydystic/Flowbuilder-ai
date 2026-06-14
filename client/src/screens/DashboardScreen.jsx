/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, workflowId: null, workflowName: '' });
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

  // React Query: Fetch workflows
  const { data: workflows = [], isLoading, error } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await axios.get('/api/workflows');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  // React Query: Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }) => {
      const res = await axios.patch(`/api/workflows/${id}/activate`, { active });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      showToast('Workflow status updated successfully');
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
      showToast(`Failed to update status: ${errorMsg}`, 'error');
    }
  });

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`/api/workflows/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      showToast('Workflow deleted successfully');
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
      showToast(`Error: ${errorMsg}`, 'error');
    }
  });

  // React Query: Deploy Retry Mutation
  const deployMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.post(`/api/workflows/${id}/deploy`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      showToast(`Workflow "${data.workflow?.name || 'Workflow'}" deployed successfully!`);
    },
    onError: (err, id) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
      showToast(`Failed to deploy workflow: ${errorMsg}`, 'error');
    }
  });

  const handleToggleActive = (id, currentActive) => {
    toggleActiveMutation.mutate({ id, active: !currentActive });
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ isOpen: true, workflowId: id, workflowName: name });
  };

  const confirmDelete = () => {
    const id = deleteModal.workflowId;
    setDeleteModal({ isOpen: false, workflowId: null, workflowName: '' });
    deleteMutation.mutate(id);
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

            {error && (
              <div className="mb-6 rounded-xl bg-[#93000a]/5 p-4 border border-[#93000a]/10 text-sm text-[#93000a]">
                <p className="font-semibold">Failed to load workflows</p>
                <p className="mt-1">{error.response?.data?.error || error.message || "An unexpected error occurred."}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {isLoading && [1, 2, 3].map((placeholderId) => (
                <div key={placeholderId} className="notion-panel p-5">
                  <div className="h-4 w-28 rounded shimmer-bg bg-black/[0.05]" />
                  <div className="mt-5 h-7 w-3/4 rounded shimmer-bg bg-black/[0.05]" />
                  <div className="mt-3 h-4 w-1/2 rounded shimmer-bg bg-black/[0.05]" />
                  <div className="mt-8 h-9 w-full rounded shimmer-bg bg-black/[0.05]" />
                </div>
              ))}

              {!isLoading && filteredWorkflows.length === 0 && (
                <p className="col-span-full rounded-xl bg-white/40 py-12 text-center text-sm text-ink-muted">
                  {searchQuery ? 'No workflows match your search query.' : 'No workflows built yet.'}
                </p>
              )}

              {!isLoading && filteredWorkflows.map((wf) => {
                const icon = getWorkflowIcon(wf.name);
                const isDeleting = deleteMutation.isPending && deleteMutation.variables === wf.id;
                const isDeploying = deployMutation.isPending && deployMutation.variables === wf.id;

                // Determine badge and status styling
                let statusBadgeText = wf.active ? 'Active' : 'Inactive';
                let statusBadgeClass = wf.active ? 'bg-primary/10 text-primary' : 'bg-black/[0.05] text-ink-muted';

                if (wf.status === 'failed') {
                  statusBadgeText = 'Failed';
                  statusBadgeClass = 'bg-[#93000a]/10 text-[#93000a]';
                } else if (wf.status === 'draft') {
                  statusBadgeText = 'Draft';
                  statusBadgeClass = 'bg-amber-500/10 text-amber-700';
                }

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
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass}`}>
                          {statusBadgeText}
                        </span>
                        
                        {(wf.status !== 'failed' && wf.status !== 'draft') && (
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={!!wf.active}
                              disabled={toggleActiveMutation.isPending}
                              onChange={() => handleToggleActive(wf.id, wf.active)}
                              className="peer sr-only"
                            />
                            <span className="h-5 w-9 rounded-full bg-black/10 transition-colors peer-checked:bg-primary" />
                            <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                          </label>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-5 truncate text-[19px] font-semibold tracking-[-0.01em] text-ink">
                      {wf.name}
                    </h3>
                    <p className="mt-1 truncate text-xs text-ink-faint">ID: {wf.id}</p>

                    {wf.deploymentError && (
                      <div className="mt-3 rounded-lg bg-[#93000a]/5 p-2.5 border border-[#93000a]/10 text-xs text-[#93000a] whitespace-pre-wrap max-h-16 overflow-y-auto">
                        {wf.deploymentError}
                      </div>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-ink-faint text-xs">Nodes</p>
                        <p className="mt-1 font-semibold text-ink">{wf.nodes ? wf.nodes.length : 0}</p>
                      </div>
                      <div>
                        <p className="text-ink-faint text-xs">Updated</p>
                        <p className="mt-1 font-semibold text-ink">
                          {wf.updatedAt
                            ? new Date(wf.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2">
                      {wf.status === 'failed' || wf.status === 'draft' ? (
                        <button
                          onClick={() => deployMutation.mutate(wf.id)}
                          disabled={isDeploying}
                          className="notion-button flex-1 h-9 gap-1 text-sm justify-center"
                          type="button"
                        >
                          <span className={`material-symbols-outlined text-[17px] ${isDeploying ? 'animate-spin' : ''}`}>
                            {isDeploying ? 'sync' : 'bolt'}
                          </span>
                          {isDeploying ? 'Deploying...' : 'Deploy'}
                        </button>
                      ) : (
                        <a
                          href={`http://localhost:5678/workflow/${wf.n8nWorkflowId || ''}`}
                          target="_blank"
                          rel="noreferrer"
                          className="notion-button-secondary flex-1 h-9 text-sm text-center justify-center flex items-center"
                        >
                          <span className="material-symbols-outlined text-[17px] mr-1">open_in_new</span>
                          n8n
                        </a>
                      )}
                      
                      <Link to={`/workflow/${wf.id}`} className="notion-button-secondary flex-1 h-9 text-sm text-center justify-center flex items-center">
                        <span className="material-symbols-outlined text-[17px] mr-1">edit</span>
                        Details
                      </Link>

                      <button
                        onClick={() => handleDeleteClick(wf.id, wf.name)}
                        disabled={deleteMutation.isPending}
                        className="notion-button-secondary h-9 w-9 px-0 hover:text-[#93000a] shrink-0 justify-center flex items-center"
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
              Delete <span className="font-semibold text-ink">"{deleteModal.workflowName}"</span>? This will remove it from Supabase and n8n.
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
