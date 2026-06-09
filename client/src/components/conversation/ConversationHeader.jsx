import React from 'react';

export default function ConversationHeader({ phase, questionsRemaining }) {
  // Define phases info
  const phases = [
    { key: 'exploring', label: 'Exploring Intent', icon: 'search', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { key: 'suggesting', label: 'Getting Suggestions', icon: 'lightbulb', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { key: 'building', label: 'Building Spec', icon: 'edit_note', color: 'text-green-400', bg: 'bg-green-400/10' },
    { key: 'ready', label: 'Ready to Generate', icon: 'task_alt', color: 'text-primary', bg: 'bg-primary/10' }
  ];

  const currentPhaseIndex = phases.findIndex(p => p.key === phase) !== -1 
    ? phases.findIndex(p => p.key === phase) 
    : 0;

  const activePhase = phases[currentPhaseIndex];

  return (
    <div className="bg-[#10101d] border-b border-outline-variant p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center p-1.5 rounded-lg ${activePhase.bg}`}>
            <span className={`material-symbols-outlined text-[18px] ${activePhase.color}`}>
              {activePhase.icon}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Current Phase</span>
            <h4 className="text-sm font-bold text-on-surface leading-tight">{activePhase.label}</h4>
          </div>
        </div>

        <div className="text-right">
          {questionsRemaining > 0 ? (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              {questionsRemaining} {questionsRemaining === 1 ? 'question' : 'questions'} remaining
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-green-400/10 text-green-400 border border-green-400/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <span className="material-symbols-outlined text-[10px] font-bold">check</span>
              Specs Aligned
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full bg-white/5 rounded-full h-1.5 border border-white/5">
        <div 
          className="bg-gradient-to-r from-primary to-blue-400 h-full rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${((currentPhaseIndex + 1) / phases.length) * 100}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between text-[9px] text-outline px-1">
        {phases.map((p, idx) => (
          <span 
            key={p.key} 
            className={`font-semibold tracking-wider uppercase ${
              idx <= currentPhaseIndex ? 'text-on-surface font-bold' : 'text-on-surface-variant/40'
            }`}
          >
            {idx + 1}. {p.label.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}
