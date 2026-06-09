import React, { useState, useEffect } from 'react';
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
  if (lower.includes('mail') || lower.includes('gmail') || lower.includes('email')) {
    return 'mail';
  }
  if (lower.includes('sheet') || lower.includes('table') || lower.includes('excel')) {
    return 'table_chart';
  }
  if (lower.includes('slack') || lower.includes('discord') || lower.includes('chat')) {
    return 'chat';
  }
  if (lower.includes('database') || lower.includes('postgres') || lower.includes('sql') || lower.includes('db')) {
    return 'database';
  }
  if (lower.includes('webhook') || lower.includes('api') || lower.includes('http')) {
    return 'lan';
  }
  if (lower.includes('sync') || lower.includes('transfer')) {
    return 'sync';
  }
  return 'data_object';
};

export default function DashboardScreen() {
  const [workflows, setWorkflows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, workflowId: null, workflowName: '' });
  const [deletingIds, setDeletingIds] = useState([]);

  // Modals state
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
    
    // Optimistic update
    setWorkflows(prev => 
      prev.map(wf => wf.id === id ? { ...wf, active: newActive } : wf)
    );
    
    try {
      await axios.patch(`/api/workflows/${id}/activate`, { active: newActive });
      showToast(`Workflow ${newActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      // Revert on error
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
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      <Header
        activeTab="dashboard"
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden h-full relative z-10">
        <Sidebar activeTab="dashboard" />

        {/* Main Content Area */}
        <main className="canvas-bg relative flex-1 overflow-y-auto">
          {/* Header/Actions Bar */}
          <div className="sticky top-0 z-10 flex flex-col justify-between gap-4 bg-background/40 px-margin-desktop py-8 backdrop-blur-md md:flex-row md:items-center">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                Workflow Directory
              </h1>
              <p className="font-body-md text-on-surface-variant">
                Manage and monitor your automated logic pipelines.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="group relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-purple-400">
                  search
                </span>
                <input
                  className="w-64 rounded-lg glass-input py-2.5 pl-10 pr-4 text-label-md font-label-md text-on-surface"
                  placeholder="Search workflows..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link
                to="/"
                className="flex items-center gap-2 rounded-lg btn-primary px-5 py-2.5 text-label-md font-label-md font-bold text-white shadow-lg active:scale-95"
              >
                <span className="material-symbols-outlined">add</span>
                New Workflow
              </Link>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 gap-gutter px-margin-desktop pb-12 md:grid-cols-2 xl:grid-cols-3">
            {isLoading && (
              <>
                {[1, 2, 3].map((placeholderId) => (
                  <div
                    key={placeholderId}
                    className="glass-card flex flex-col gap-4 rounded-xl p-6 border border-white/10 bg-white/5 shadow-lg relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <div className="h-12 w-12 rounded-lg shimmer-bg"></div>
                      <div className="h-6 w-20 rounded-full shimmer-bg"></div>
                    </div>
                    <div className="space-y-3 mt-2">
                      <div className="h-6 w-3/4 rounded shimmer-bg"></div>
                      <div className="h-4 w-1/2 rounded shimmer-bg"></div>
                    </div>
                    <div className="h-px bg-white/10 my-2"></div>
                    <div className="flex justify-between items-center mt-auto">
                      <div className="h-4 w-1/4 rounded shimmer-bg"></div>
                      <div className="flex gap-2">
                        <div className="h-8 w-16 rounded shimmer-bg"></div>
                        <div className="h-8 w-16 rounded shimmer-bg"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {!isLoading && filteredWorkflows.length === 0 && (
              <p className="col-span-full text-center py-10 text-on-surface-variant italic">
                {searchQuery ? 'No workflows match your search query.' : 'No workflows built yet.'}
              </p>
            )}

            {!isLoading &&
              filteredWorkflows.map((wf) => {
                const icon = getWorkflowIcon(wf.name);
                const isDeleting = deletingIds.includes(wf.id);
                return (
                  <div
                    key={wf.id}
                    className={`glass-card group flex flex-col gap-4 rounded-xl p-6 transition-all border border-white/10 bg-white/5 shadow-lg hover:border-primary ${
                      isDeleting ? 'opacity-0 scale-95 duration-300 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors group-hover:border-purple-400">
                        <span className="material-symbols-outlined text-purple-400 text-[24px]">
                          {icon}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {wf.active ? (
                          <div className="flex items-center gap-1.5 badge-active px-3 py-1 rounded-full text-[11px] font-bold">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 badge-inactive px-3 py-1 rounded-full text-[11px] font-bold">
                            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                            Inactive
                          </div>
                        )}
                        
                        {/* Toggle switch next to badge */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!wf.active}
                            onChange={() => handleToggleActive(wf.id, wf.active)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-headline-md text-[18px] text-on-surface font-bold truncate">
                        {wf.name}
                      </h3>
                      <p className="font-label-md text-[12px] text-on-surface-variant opacity-60">
                        ID: {wf.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 border-y border-white/10 py-2">
                      <div className="flex flex-col">
                        <span className="font-label-md text-[10px] uppercase text-outline">Nodes</span>
                        <span className="font-headline-md text-[16px] text-on-surface">
                          {wf.nodes ? wf.nodes.length : 0}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-[10px] uppercase text-outline">Updated</span>
                        <span className="font-headline-md text-[16px] text-on-surface truncate max-w-[150px]">
                          {wf.updatedAt
                            ? new Date(wf.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <a
                        href="http://localhost:5678"
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-label-md font-label-md text-on-surface transition-colors hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/30"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>{' '}
                        n8n
                      </a>
                      <Link
                        to={`/workflow/${wf.id}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-label-md font-label-md text-on-surface transition-colors hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/30"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(wf.id, wf.name)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-on-surface-variant transition-colors hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md rounded-xl p-6 border border-white/10 bg-white/5 shadow-2xl">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-2 font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">warning</span>
              Delete Workflow
            </h3>
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Delete <span className="font-bold text-white">"{deleteModal.workflowName}"</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, workflowId: null, workflowName: '' })}
                className="px-4 py-2 rounded-lg border border-white/20 text-on-surface hover:bg-white/10 transition-colors transition-hover"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold transition-all transition-hover shadow-lg shadow-red-500/25 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Overlay Modals */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        showToast={showToast}
      />
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Render Toasts */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
