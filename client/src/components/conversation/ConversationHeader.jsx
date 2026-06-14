export default function ConversationHeader({ phase, questionsRemaining }) {
  const phases = [
    { key: 'exploring', label: 'Exploring', icon: 'search' },
    { key: 'suggesting', label: 'Suggesting', icon: 'lightbulb' },
    { key: 'building', label: 'Building', icon: 'edit_note' },
    { key: 'ready', label: 'Ready', icon: 'task_alt' }
  ];

  const currentPhaseIndex = phases.findIndex(p => p.key === phase) !== -1
    ? phases.findIndex(p => p.key === phase)
    : 0;

  const activePhase = phases[currentPhaseIndex];

  return (
    <div className="shrink-0 pt-4 pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="material-symbols-outlined text-[18px] text-primary">
            {activePhase.icon}
          </span>
          <span className="font-medium text-ink">{activePhase.label}</span>
          <span className="text-ink-faint">/</span>
          <span>Workflow drafting</span>
        </div>

        {questionsRemaining > 0 ? (
          <span className="notion-chip">
            {questionsRemaining} {questionsRemaining === 1 ? 'question' : 'questions'} left
          </span>
        ) : (
          <span className="text-sm font-medium text-ink-muted">Specs aligned</span>
        )}
      </div>

      <div className="mt-3 h-1 rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${((currentPhaseIndex + 1) / phases.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
