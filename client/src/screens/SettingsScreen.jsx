import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import axios from 'axios';

export default function SettingsScreen() {
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('flowbuilder_theme') || 'light');
  const [config, setConfig] = useState({
    aiProvider: 'Loading configurations...',
    n8nUrl: 'Loading configurations...',
    demoMode: true
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get('/api/config');
        setConfig(res.data);
      } catch (err) {
        console.error('Error fetching backend config:', err);
        setConfig({
          aiProvider: 'Default (Offline Simulation)',
          n8nUrl: 'http://localhost:5678',
          demoMode: true
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveSettings = () => {
    // Persist theme choice
    localStorage.setItem('flowbuilder_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showToast('Preferences saved successfully!');
    // Trigger global event in case header needs to update immediately
    window.dispatchEvent(new Event('flowbuilder_notifications_updated'));
  };

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden text-[#000000]">
      <Header activeTab="settings" />
      
      <div className="flex h-full flex-1 overflow-hidden">
        <Sidebar activeTab="settings" />

        <main className="flex-1 overflow-y-auto px-8 py-8 bg-[#f6f5f4]">
          <div className="mx-auto max-w-2xl bg-white rounded-xl border border-[#e6e6e6] p-8 shadow-sm">
            <h1 className="text-[30px] font-semibold tracking-[-0.015em] text-ink">
              Settings
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Configure FlowBuilder preferences and configurations.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Appearance Mode</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="notion-input mt-1 w-full"
                >
                  <option value="light">Light Mode (Notion Warm Paper)</option>
                  <option value="dark">Dark Mode (Notion Charcoal)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">AI Provider</label>
                <p className="mt-1 text-sm font-medium text-ink bg-[#f6f5f4] px-3 py-2 rounded-md border border-[#e6e6e6] select-all">
                  {isLoading ? 'Fetching AI Provider...' : `${config.aiProvider} (configured via backend)`}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">n8n Instance URL</label>
                <p className="mt-1 text-sm font-medium text-ink bg-[#f6f5f4] px-3 py-2 rounded-md border border-[#e6e6e6] select-all font-mono">
                  {isLoading ? 'Fetching n8n URL...' : `${config.n8nUrl} (configured via backend)`}
                </p>
              </div>

              <div className="pt-4 border-t border-[#e6e6e6] flex justify-end gap-2">
                <button
                  onClick={handleSaveSettings}
                  className="notion-button h-10 px-4"
                  type="button"
                >
                  Save Preferences
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}
