export default function InputArea({ prompt, setPrompt, onSubmit, isLoading, suggestions, onSelectSuggestion, hasMessages }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className={`${hasMessages ? 'pb-5' : ''}`}>
      {!hasMessages && prompt === '' && suggestions?.length > 0 && (
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectSuggestion(s)}
              className="rounded-full bg-white/70 px-3 py-1.5 text-sm text-ink-muted shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-white hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="mx-auto w-full max-w-3xl">
        <div className="notion-surface flex items-end gap-3 p-3">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] flex-1 resize-none border-none bg-transparent px-2 py-2 text-[15px] leading-6 text-ink outline-none placeholder:text-ink-faint focus:ring-0"
            placeholder="Ask FlowBuilder to create an automation..."
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="notion-button h-9 px-3"
            title="Send"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
