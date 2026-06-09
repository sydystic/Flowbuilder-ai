import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  // Modals state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Modal states
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
      // Backend returns a list of credentials
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
      // Build request body based on type
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

      const res = await axios.post('/api/credentials', {
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
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      <Header
        activeTab="credentials"
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden h-full relative z-10">
        <Sidebar activeTab="credentials" />

        {/* Main Content Area */}
        <main className="canvas-bg relative flex-1 overflow-y-auto">
          {/* Header/Actions Bar */}
          <div className="sticky top-0 z-10 flex flex-col justify-between gap-4 bg-background/40 px-margin-desktop py-8 backdrop-blur-md md:flex-row md:items-center">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                Credentials
              </h1>
              <p className="font-body-md text-on-surface-variant">
                Manage your service API keys and integrations securely.
              </p>
            </div>
            <button
              onClick={() => handleOpenAddModal('slackApi')}
              className="flex items-center gap-2 rounded-lg btn-primary px-5 py-2.5 text-label-md font-label-md font-bold text-white shadow-lg active:scale-95"
            >
              <span className="material-symbols-outlined">add</span>
              Add Credential
            </button>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 gap-gutter px-margin-desktop pb-12 md:grid-cols-2 xl:grid-cols-3">
            {SERVICE_TYPES.map((service) => {
              // Find if this credential is connected
              const connections = credentials.filter(c => c.type === service.id);
              const isConnected = connections.length > 0;

              return (
                <div
                  key={service.id}
                  className="glass-card group flex flex-col justify-between gap-6 rounded-xl p-6 border border-white/10 bg-white/5 shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors group-hover:border-purple-400">
                        <span className="material-symbols-outlined text-purple-400 text-[24px]">
                          {service.icon}
                        </span>
                      </div>

                      {isConnected ? (
                        <div className="flex items-center gap-1.5 badge-active px-3 py-1 rounded-full text-[11px] font-bold">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          Connected
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 badge-inactive px-3 py-1 rounded-full text-[11px] font-bold">
                          <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                          Not Connected
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-headline-md text-[18px] text-on-surface font-bold">
                        {service.name}
                      </h3>
                      <p className="text-body-md text-on-surface-variant text-[13px] leading-relaxed mt-1">
                        {service.desc}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {isConnected && (
                      <div className="bg-black/20 rounded-lg p-2 border border-white/5 space-y-1">
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest px-1">Active Connections</p>
                        {connections.map((c) => (
                          <div key={c.id} className="flex justify-between items-center px-1.5 py-1 hover:bg-white/5 rounded transition-all">
                            <span className="text-xs text-on-surface truncate max-w-[150px]">{c.name}</span>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="text-on-surface-variant hover:text-red-400 p-0.5 active:scale-95 transition-all"
                              title="Delete Credential"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleOpenAddModal(service.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-label-md font-label-md text-on-surface transition-colors hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/30"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Connect Account
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Add Credential Glass Modal / Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-xl p-6 border border-white/10 bg-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-md font-headline-md text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">key</span>
                Connect Service
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-on-surface-variant">Service Type</label>
                <select
                  value={credType}
                  onChange={(e) => {
                    setCredType(e.target.value);
                    setFormData({});
                  }}
                  className="rounded-lg glass-input py-2 px-3 text-label-md outline-none bg-[#131318]"
                >
                  {SERVICE_TYPES.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-on-surface-variant">Connection Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Slack Connection"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="rounded-lg glass-input py-2 px-3 text-label-md"
                />
              </div>

              {/* Slack Specific Inputs */}
              {credType === 'slackApi' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase font-bold text-on-surface-variant">Bot Token (xoxb-...)</label>
                  <input
                    type="password"
                    required
                    placeholder="xoxb-xxxxxxxxxxxx-xxxxxxxxxxxxx"
                    value={formData.botToken || ''}
                    onChange={(e) => handleInputChange('botToken', e.target.value)}
                    className="rounded-lg glass-input py-2 px-3 text-label-md"
                  />
                </div>
              )}

              {/* Gmail Specific Inputs */}
              {credType === 'gmailApi' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-bold text-on-surface-variant">Client ID</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Google Client ID"
                      value={formData.clientId || ''}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      className="rounded-lg glass-input py-2 px-3 text-label-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-bold text-on-surface-variant">Client Secret</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter Google Client Secret"
                      value={formData.clientSecret || ''}
                      onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                      className="rounded-lg glass-input py-2 px-3 text-label-md"
                    />
                  </div>
                </div>
              )}

              {/* Telegram Specific Inputs */}
              {credType === 'telegramApi' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase font-bold text-on-surface-variant">Bot Token</label>
                  <input
                    type="password"
                    required
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    value={formData.botToken || ''}
                    onChange={(e) => handleInputChange('botToken', e.target.value)}
                    className="rounded-lg glass-input py-2 px-3 text-label-md"
                  />
                </div>
              )}

              {/* GitHub Specific Inputs */}
              {credType === 'githubApi' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase font-bold text-on-surface-variant">Personal Access Token</label>
                  <input
                    type="password"
                    required
                    placeholder="github_pat_..."
                    value={formData.token || ''}
                    onChange={(e) => handleInputChange('token', e.target.value)}
                    className="rounded-lg glass-input py-2 px-3 text-label-md"
                  />
                </div>
              )}

              {/* Generic/Webhook Specific Inputs */}
              {credType === 'genericApi' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-bold text-on-surface-variant">Header Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Authorization or X-API-KEY"
                      value={formData.headerName || ''}
                      onChange={(e) => handleInputChange('headerName', e.target.value)}
                      className="rounded-lg glass-input py-2 px-3 text-label-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-bold text-on-surface-variant">Header Value</label>
                    <input
                      type="password"
                      required
                      placeholder="Bearer token_value..."
                      value={formData.headerValue || ''}
                      onChange={(e) => handleInputChange('headerValue', e.target.value)}
                      className="rounded-lg glass-input py-2 px-3 text-label-md"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-white/20 text-on-surface hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg btn-primary font-bold active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Connecting...' : 'Save Connection'}
                </button>
              </div>
            </form>
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
