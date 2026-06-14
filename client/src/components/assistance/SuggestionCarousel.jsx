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
    ? "Variations for Google Sheets to Slack"
    : "Popular automation templates";

  return (
    <section className="rounded-xl bg-white/52 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
        Suggestions
      </div>
      <p className="mt-1 text-sm leading-5 text-ink-muted">{headerLabel}</p>

      <div className="mt-3 space-y-1">
        {suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectTemplate(s.text)}
            className="block w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/[0.04]"
          >
            <span className="block text-sm font-medium text-ink">{s.title}</span>
            <span className="mt-0.5 block text-sm leading-5 text-ink-muted">{s.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
