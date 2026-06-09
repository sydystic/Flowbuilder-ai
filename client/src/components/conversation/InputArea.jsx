import React from 'react';

export default function InputArea({ prompt, setPrompt, onSubmit, isLoading, suggestions, onSelectSuggestion, hasMessages }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="p-6 bg-surface border-t border-outline-variant">
      {/* Dynamic suggestions above input when conversation is fresh */}
      {!hasMessages && prompt === '' && suggestions?.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectSuggestion(s)}
                className="text-[11px] font-label-md text-on-surface-variant bg-surface-container-high border border-outline-variant hover:border-primary hover:text-on-surface px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="max-w-4xl mx-auto relative">
        <div className="flex items-end gap-3 bg-surface-container p-4 rounded-xl border border-outline-variant focus-within:border-primary focus-within:shadow-[0_0_15px_rgba(173,198,255,0.15)] transition-all">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder-on-surface-variant/50 resize-none py-2 font-body-md text-body-md outline-none"
            placeholder="Describe your automation… (e.g. sync new Row from Sheets to Slack)"
            rows={1}
            disabled={isLoading}
          />
          <div className="flex items-center gap-2 mb-1">
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="bg-primary text-on-primary px-6 py-2.5 rounded font-label-md text-label-md font-bold flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100 cursor-pointer"
            >
              <span>Send</span>
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
        <p className="text-[10px] text-on-surface-variant mt-2 px-2 text-center opacity-50">
          FlowBuilder AI will clarify intent and build the spec in the side panel. Press Shift+Enter for a new line.
        </p>
      </form>
    </div>
  );
}
