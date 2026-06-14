/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../components/Toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SettingsModal from '../components/modals/SettingsModal';
import NotificationsModal from '../components/modals/NotificationsModal';
import ProfileModal from '../components/modals/ProfileModal';

const SERVICE_TYPES = [
  { id: 'slackApi', name: 'Slack', icon: 'chat', desc: 'Send notifications and chat messages' },
  { id: 'gmailApi', name: 'Gmail', icon: 'mail', desc: 'Read and send automated emails' },
  { id: 'telegramApi', name: 'Telegram', icon: 'near_me', desc: 'Interact with Telegram chat bots' },
  { id: 'githubApi', name: 'GitHub', icon: 'code', desc: 'Trigger workflows from repository events' },
  { id: 'genericApi', name: 'Generic / Webhook', icon: 'lan', desc: 'Connect custom APIs and headers' },
];

export default function CredentialsScreen() {
  const [credentials, setCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credType, setCredType] = useState('slackApi');
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/credentials');
      setCredentials(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch credentials', err);
      showToast('Failed to load credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleOpenAddModal = (type = 'slackApi') => {
    setCredType(type);
    setFormData({});
    setIsModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let dataObject = {};
      let name = '';

      if (credType === 'slackApi') {
        dataObject = { accessToken: formData.botToken };
        name = formData.name || 'Slack Bot Connection';
      } else if (credType === 'gmailApi') {
        dataObject = { clientId: formData.clientId, clientSecret: formData.clientSecret };
        name = formData.name || 'Gmail OAuth Connection';
      } else if (credType === 'telegramApi') {
        dataObject = { accessToken: formData.botToken };
        name = formData.name || 'Telegram Bot Connection';
      } else if (credType === 'githubApi') {
        dataObject = { accessToken: formData.token };
        name = formData.name || 'GitHub PAT Connection';
      } else if (credType === 'genericApi') {
        dataObject = { name: formData.headerName, value: formData.headerValue };
        name = formData.name || `Webhook: ${formData.headerName || 'API Key'}`;
      }

      await axios.post('/api/credentials', {
        name,
        type: credType,
        data: dataObject,
      });

      showToast('Credential added successfully!');
      setIsModalOpen(false);
      fetchCredentials();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save credential';
      showToast(errorMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to disconnect this service?')) return;
    try {
      await axios.delete(`/api/credentials/${id}`);
      showToast('Credential removed successfully!');
      fetchCredentials();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to delete credential';
      showToast(errorMsg, 'error');
    }
  };

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
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-sm font-medium text-primary">Credentials</p>
                <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em] text-ink">
                  Connected Services
                </h1>
                <p className="mt-2 text-[15px] text-ink-muted">
                  Manage the accounts FlowBuilder can use when generating and deploying workflows.
                </p>
              </div>
              <button onClick={() => handleOpenAddModal('slackApi')} className="notion-button" type="button">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Credential
              </button>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map(id => (
                  <div key={id} className="notion-panel p-5">
                    <div className="h-7 w-2/3 rounded shimmer-bg" />
                    <div className="mt-4 h-4 w-full rounded shimmer-bg" />
                    <div className="mt-8 h-9 w-full rounded shimmer-bg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SERVICE_TYPES.map((service) => {
                  const connections = credentials.filter(c => c.type === service.id);
                  const isConnected = connections.length > 0;

                  return (
                    <article key={service.id} className="notion-panel p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-primary">
                          <span className="material-symbols-outlined text-[22px]">{service.icon}</span>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isConnected ? 'bg-primary/10 text-primary' : 'bg-black/[0.05] text-ink-muted'
                        }`}>
                          {isConnected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>

                      <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.01em] text-ink">
                        {service.name}
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-ink-muted">{service.desc}</p>

                      {isConnected && (
                        <div className="mt-5 space-y-1">
                          <p className="px-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
                            Active connections
                          </p>
                          {connections.map((c) => (
                            <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-black/[0.04]">
                              <span className="truncate text-sm text-ink">{c.name}</span>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="notion-nav-item flex h-7 w-7 items-center justify-center hover:text-[#93000a]"
                                title="Delete Credential"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenAddModal(service.id)}
                        className="notion-button-secondary mt-5 w-full"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Connect Account
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="notion-surface w-full max-w-lg p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-ink">Connect Service</h3>
              <button onClick={() => setIsModalOpen(false)} className="notion-nav-item flex h-8 w-8 items-center justify-center" type="button">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Field label="Service Type">
                <select
                  value={credType}
                  onChange={(e) => {
                    setCredType(e.target.value);
                    setFormData({});
                  }}
                  className="notion-input"
                >
                  {SERVICE_TYPES.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Connection Name">
                <input
                  type="text"
                  required
                  placeholder="e.g. My Slack Connection"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="notion-input"
                />
              </Field>

              {credType === 'slackApi' && (
                <Field label="Bot Token (xoxb-...)">
                  <input type="password" required placeholder="xoxb-xxxxxxxxxxxx-xxxxxxxxxxxxx" value={formData.botToken || ''} onChange={(e) => handleInputChange('botToken', e.target.value)} className="notion-input" />
                </Field>
              )}

              {credType === 'gmailApi' && (
                <>
                  <Field label="Client ID">
                    <input type="text" required placeholder="Enter Google Client ID" value={formData.clientId || ''} onChange={(e) => handleInputChange('clientId', e.target.value)} className="notion-input" />
                  </Field>
                  <Field label="Client Secret">
                    <input type="password" required placeholder="Enter Google Client Secret" value={formData.clientSecret || ''} onChange={(e) => handleInputChange('clientSecret', e.target.value)} className="notion-input" />
                  </Field>
                </>
              )}

              {credType === 'telegramApi' && (
                <Field label="Bot Token">
                  <input type="password" required placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" value={formData.botToken || ''} onChange={(e) => handleInputChange('botToken', e.target.value)} className="notion-input" />
                </Field>
              )}

              {credType === 'githubApi' && (
                <Field label="Personal Access Token">
                  <input type="password" required placeholder="github_pat_..." value={formData.token || ''} onChange={(e) => handleInputChange('token', e.target.value)} className="notion-input" />
                </Field>
              )}

              {credType === 'genericApi' && (
                <>
                  <Field label="Header Name">
                    <input type="text" required placeholder="Authorization or X-API-KEY" value={formData.headerName || ''} onChange={(e) => handleInputChange('headerName', e.target.value)} className="notion-input" />
                  </Field>
                  <Field label="Header Value">
                    <input type="password" required placeholder="Bearer token_value..." value={formData.headerValue || ''} onChange={(e) => handleInputChange('headerValue', e.target.value)} className="notion-input" />
                  </Field>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="notion-button-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="notion-button">
                  {isSaving ? 'Connecting...' : 'Save Connection'}
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
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
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
