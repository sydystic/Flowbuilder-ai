import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Toast from '../components/Toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SettingsModal from '../components/modals/SettingsModal';
import NotificationsModal from '../components/modals/NotificationsModal';
import ProfileModal from '../components/modals/ProfileModal';

const CATEGORIES = ['All', 'Google', 'Communication', 'AI', 'Productivity', 'Payments', 'CRM', 'Email', 'Developer', 'Storage', 'Generic'];

export default function CredentialsScreen() {
  const [credTypes, setCredTypes] = useState({});
  const [credentials, setCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = id => setToasts(prev => prev.filter(t => t.id !== id));

  // Load credential type definitions from backend
  const loadTypes = useCallback(async () => {
    try {
      const res = await axios.get('/api/credentials/types');
      setCredTypes(res.data);
    } catch (err) {
      console.error('Failed to load credential types', err.message);
    }
  }, []);

  // Fetch all credentials from n8n (source of truth)
  const fetchCredentials = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsSyncing(true);
    try {
      const res = await axios.get('/api/credentials');
      setCredentials(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (!silent) showToast('Failed to load credentials from n8n', 'error');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadTypes();
    fetchCredentials();

    // Poll n8n every 15 seconds for bidirectional sync
    // (picks up creds added directly in n8n UI)
    const interval = setInterval(() => fetchCredentials(true), 15000);
    return () => clearInterval(interval);
  }, [loadTypes, fetchCredentials]);

  const handleOpenModal = (typeId) => {
    setSelectedType(typeId);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedType) return;
    setIsSaving(true);
    try {
      const { name, ...credData } = formData;
      await axios.post('/api/credentials', {
        name: name || `${credTypes[selectedType]?.name} Connection`,
        type: selectedType,
        data: credData
      });
      showToast(`${credTypes[selectedType]?.name} connected successfully!`);
      if (window.addFlowBuilderNotification) {
        window.addFlowBuilderNotification('success', 'Credential connected', `Successfully connected ${name || credTypes[selectedType]?.name}`);
      }
      setIsModalOpen(false);
      fetchCredentials();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Disconnect "${name}"? This removes it from n8n too.`)) return;
    try {
      await axios.delete(`/api/credentials/${id}`);
      showToast('Credential removed from n8n');
      if (window.addFlowBuilderNotification) {
        window.addFlowBuilderNotification('warning', 'Credential disconnected', `Removed connection for ${name}`);
      }
      fetchCredentials();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  // Get connected credential IDs grouped by type
  const connectedByType = credentials.reduce((acc, c) => {
    if (!acc[c.type]) acc[c.type] = [];
    acc[c.type].push(c);
    return acc;
  }, {});

  // Filter types by category + search
  const filteredTypes = Object.entries(credTypes).filter(([id, meta]) => {
    const matchCat = activeCategory === 'All' || meta.category === activeCategory;
    const matchSearch = !searchQuery ||
      meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const currentTypeMeta = selectedType ? credTypes[selectedType] : null;

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden">
      <Header
        activeTab="credentials"
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div className="flex h-full flex-1 overflow-hidden">
        <Sidebar activeTab="credentials" />

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-6xl">

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em] text-ink">
                  Connected Services
                </h1>
                <p className="mt-1 text-[15px] text-ink-muted">
                  Credentials sync directly with n8n. Add here or in n8n - both stay in sync
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchCredentials()}
                  disabled={isLoading || isSyncing}
                  className="notion-button-secondary flex items-center gap-1"
                  type="button"
                  title="Sync with n8n"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  {isSyncing ? 'Syncing...' : 'Sync n8n'}
                </button>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ink-faint">search</span>
                  <input
                    className="notion-input w-56 pl-9"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* n8n sync notice */}
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-3 text-sm text-primary">
              <span className="material-symbols-outlined text-[18px]">info</span>
              Credentials added directly in n8n auto-appear here within 15 seconds. Deletions sync immediately.
            </div>

            {/* Category tabs */}
            <div className="mb-5 flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-white/70 text-ink-muted hover:bg-white hover:text-ink'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Stats bar */}
            <div className="mb-5 flex items-center gap-4 text-sm text-ink-muted">
              <span>
                <span className="font-semibold text-ink">{credentials.length}</span> connected
              </span>
              <span className="h-3 w-px bg-hairline" />
              <span>
                <span className="font-semibold text-ink">{filteredTypes.length}</span> services shown
              </span>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(id => (
                  <div key={id} className="notion-panel p-5">
                    <div className="h-7 w-2/3 rounded shimmer-bg" />
                    <div className="mt-4 h-4 w-full rounded shimmer-bg" />
                    <div className="mt-8 h-9 w-full rounded shimmer-bg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredTypes.map(([typeId, meta]) => {
                  const connections = connectedByType[typeId] || [];
                  const isConnected = connections.length > 0;

                  return (
                    <article key={typeId} className="notion-panel p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-primary">
                          <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isConnected
                            ? 'bg-primary/10 text-primary'
                            : 'bg-black/[0.05] text-ink-muted'
                            }`}>
                            {isConnected ? `${connections.length} connected` : 'Not connected'}
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">
                        {meta.name}
                      </h3>
                      <p className="mt-1 text-xs text-ink-faint">{meta.category}</p>
                      <p className="mt-1 text-sm leading-5 text-ink-muted">{meta.description}</p>

                      {isConnected && (
                        <div className="mt-4 space-y-1">
                          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                            Active connections
                          </p>
                          {connections.map(c => (
                            <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-black/[0.04]">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                <span className="truncate text-sm text-ink">{c.name}</span>
                              </div>
                              <button
                                onClick={() => handleDelete(c.id, c.name)}
                                className="notion-nav-item flex h-7 w-7 shrink-0 items-center justify-center hover:text-[#93000a]"
                                type="button"
                                title="Disconnect"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenModal(typeId)}
                        className="notion-button-secondary mt-4 w-full"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        {isConnected ? 'Add Another' : 'Connect'}
                      </button>
                    </article>
                  );
                })}

                {filteredTypes.length === 0 && (
                  <p className="col-span-full py-12 text-center text-sm text-ink-muted">
                    No services match your search.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Credential Modal */}
      {isModalOpen && currentTypeMeta && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="notion-surface w-full max-w-lg p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[20px]">{currentTypeMeta.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Connect {currentTypeMeta.name}</h3>
                  <p className="text-xs text-ink-muted">{currentTypeMeta.category}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="notion-nav-item flex h-8 w-8 items-center justify-center"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Field label="Connection Name (optional)">
                <input
                  type="text"
                  placeholder={`My ${currentTypeMeta.name} Connection`}
                  value={formData.name || ''}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="notion-input"
                />
              </Field>

              {currentTypeMeta.fields.map(field => (
                <Field key={field.key} label={field.label}>
                  <input
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                    className="notion-input"
                  />
                </Field>
              ))}

              <p className="text-xs text-ink-faint">
                This credential will be saved directly to your n8n instance and available in all generated workflows.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="notion-button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="notion-button">
                  {isSaving ? 'Connecting...' : `Connect ${currentTypeMeta.name}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} showToast={showToast} />
      <NotificationsModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}