import React from 'react';

const SPECIFIC_SUGGESTIONS = {
  sheet_slack: [
    { id: 1, title: "Status Update Trigger", desc: "Only notify when 'Status' column changes to 'Complete'", text: "Only trigger when the status column changes to Complete" },
    { id: 2, title: "Include Row Link", desc: "Include a direct clickable row link in the Slack alert", text: "Please add a direct link to the spreadsheet row in the Slack message" },
    { id: 3, title: "Daily Digest Mode", desc: "Send a daily summary digest instead of instant messages", text: "Make it a daily digest sent at 9am instead of real-time alerts" }
  ],
  general: [
    { id: 1, title: "Stripe Failed Alert", desc: "Notify Slack when Stripe charge fails", text: "Send a Slack alert when a Stripe payment fails" },
    { id: 2, title: "GitHub Issue Alert", desc: "Email me when GitHub issue is labeled urgent", text: "Send an email when a GitHub issue is labeled urgent" },
    { id: 3, title: "Notion Postgres Sync", desc: "Sync new Notion rows to a Postgres table", text: "Sync Notion database entries to a Postgres table" }
  ]
};

export default function SuggestionCarousel({ trigger, action, onSelectTemplate }) {
  const isSheet = trigger?.toLowerCase().includes('sheet') || trigger?.toLowerCase().includes('table');
  const isSlack = action?.toLowerCase().includes('slack') || action?.toLowerCase().includes('chat');
  
  const suggestions = (isSheet && isSlack) 
    ? SPECIFIC_SUGGESTIONS.sheet_slack 
    : SPECIFIC_SUGGESTIONS.general;

  const headerLabel = (isSheet && isSlack)
    ? "Variations for Google Sheets to Slack:"
    : "Popular automation templates:";

  return (
    <div className="glass-card p-4 rounded-xl border border-white/5 bg-[#0e0e16]/60 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
        Contextual Suggestions
      </div>
      <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
        {headerLabel}
      </p>
      
      <div className="flex flex-col gap-2.5">
        {suggestions.map((s) => (
          <div 
            key={s.id} 
            className="flex flex-col gap-2 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-white/10 transition-all text-left"
          >
            <div>
              <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span className="text-primary font-bold">{s.id}.</span> {s.title}
              </div>
              <div className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">{s.desc}</div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSelectTemplate(s.text)}
                className="text-[9px] font-bold bg-primary text-on-primary px-3 py-1 rounded hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Use Pattern
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
