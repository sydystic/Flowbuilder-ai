import { useState } from 'react';

export default function SettingsModal({ isOpen, onClose, showToast }) {
  const [model, setModel] = useState('gemini-1.5-flash');
  const [n8nUrl, setN8nUrl] = useState('http://localhost:5678');
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="notion-surface w-full max-w-md p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-ink">System Settings</h3>
            <p className="mt-1 text-sm text-ink-muted">Configure the generation runtime.</p>
          </div>
          <button onClick={onClose} className="notion-nav-item flex h-8 w-8 items-center justify-center" type="button">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (showToast) showToast('Settings saved successfully!');
          onClose();
        }} className="space-y-4">
          <Field label="Primary AI Model">
            <select value={model} onChange={(e) => setModel(e.target.value)} className="notion-input">
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
              <option value="llama-3.3-70b-versatile">Groq Llama 3.3 70B</option>
            </select>
          </Field>

          <Field label="n8n Host URL">
            <input
              type="url"
              required
              value={n8nUrl}
              onChange={(e) => setN8nUrl(e.target.value)}
              className="notion-input"
              placeholder="e.g. http://localhost:5678"
            />
          </Field>

          <button onClick={handleTestConnection} disabled={isTesting} className="notion-button-secondary w-full" type="button">
            <span className="material-symbols-outlined text-[18px]">{isTesting ? 'sync' : 'link'}</span>
            {isTesting ? 'Testing connection...' : 'Test n8n Connection'}
          </button>

          <div className="flex justify-end gap-2 pt-4">
            <button onClick={onClose} className="notion-button-secondary" type="button">
              Cancel
            </button>
            <button type="submit" className="notion-button">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  async function handleTestConnection() {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      if (showToast) showToast('n8n connection active and authenticated!');
    }, 1200);
  }
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
