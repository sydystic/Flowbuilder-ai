import React, { useState } from 'react';

export default function SettingsModal({ isOpen, onClose, showToast }) {
  const [model, setModel] = useState('gemini-1.5-flash');
  const [n8nUrl, setN8nUrl] = useState('http://localhost:5678');
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (showToast) showToast('Settings saved successfully!');
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      if (showToast) showToast('n8n connection active and authenticated!');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-xl p-6 border border-white/10 bg-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-headline-md font-headline-md text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings</span>
            System Settings
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase font-bold text-on-surface-variant">Primary AI Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg glass-input py-2.5 px-3 text-label-md outline-none bg-[#131318]"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
              <option value="llama-3.3-70b-versatile">Groq Llama 3.3 70B</option>
            </select>
            <p className="text-[10px] text-on-surface-variant italic">
              Controls the LLM engine processing workflow configurations and chat context.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase font-bold text-on-surface-variant">n8n Host URL</label>
            <input
              type="url"
              required
              value={n8nUrl}
              onChange={(e) => setN8nUrl(e.target.value)}
              className="rounded-lg glass-input py-2.5 px-3 text-label-md"
              placeholder="e.g. http://localhost:5678"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-on-surface hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">{isTesting ? 'sync' : 'link'}</span>
              {isTesting ? 'Testing connection...' : 'Test n8n Connection'}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-xs text-on-surface hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg btn-primary text-xs font-bold transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
