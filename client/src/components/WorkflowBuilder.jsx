import ConversationHeader from './conversation/ConversationHeader';
import ConversationHistory from './conversation/ConversationHistory';
import InputArea from './conversation/InputArea';
import WorkflowSpecPanel from './spec/WorkflowSpecPanel';
import SuggestionCarousel from './assistance/SuggestionCarousel';
import CredentialBanner from './auth/CredentialBanner';

export default function WorkflowBuilder({
  activeSessionId,
  messages,
  prompt,
  setPrompt,
  isLoading,
  spec,
  setSpec,
  isReadyToGenerate,
  handleSend,
  handleAnswerClarify,
  handleSuggestion,
  handleDeployWorkflow,
  showToast
}) {
  const getPhase = () => {
    if (isReadyToGenerate) return 'ready';

    const hasTrigger = spec.trigger?.service && spec.trigger.service !== '[unknown]';
    const hasAction = spec.action?.service && spec.action.service !== '[unknown]';

    if (hasTrigger && hasAction) return 'building';
    if (hasTrigger || hasAction) return 'suggesting';
    return 'exploring';
  };

  const currentPhase = getPhase();
  const lastMsg = [...messages].reverse().find(m => m.messageType === 'clarifying_question');
  const remainingQuestions = lastMsg && !lastMsg.answered && lastMsg.questions
    ? lastMsg.questions.length
    : 0;

  const suggestions = [
    'Send a Slack alert when a GitHub issue is labeled "urgent"',
    'Email me a daily summary of new Google Sheets rows',
    'Post to Discord when a new RSS item matches a keyword',
    'Sync new Notion database entries to a Postgres table',
    'Trigger a webhook when a Stripe payment fails',
  ];

  return (
    <div className="flex flex-1 overflow-hidden h-full bg-canvas-soft">
      <section className="flex-1 flex flex-col overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-[980px] flex-col px-8">
          <ConversationHeader
            phase={currentPhase}
            questionsRemaining={remainingQuestions}
          />

          {messages.length === 0 && !activeSessionId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="max-w-2xl">
                <p className="mb-3 text-sm font-medium text-primary">FlowBuilder AI</p>
                <h2 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-ink">
                  What automation can I build for you?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-6 text-ink-muted">
                  Describe the workflow in plain English. I will clarify the missing pieces, shape the spec, and prepare it for n8n.
                </p>
              </div>
              <div className="mt-10 w-full">
                <InputArea
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onSubmit={handleSend}
                  isLoading={isLoading}
                  suggestions={suggestions}
                  onSelectSuggestion={handleSuggestion}
                  hasMessages={false}
                />
              </div>
            </div>
          ) : (
            <>
              <ConversationHistory
                messages={messages}
                onAnswerClarify={handleAnswerClarify}
                onSelectTemplate={handleSuggestion}
                isLoading={isLoading}
              />
              <InputArea
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={handleSend}
                isLoading={isLoading}
                suggestions={suggestions}
                onSelectSuggestion={handleSuggestion}
                hasMessages={true}
              />
            </>
          )}
        </div>
      </section>

      <aside className="w-[360px] h-full flex flex-col overflow-y-auto px-5 py-5">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Inspector
          </p>
          <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.015em] text-ink">
            Workflow Spec
          </h3>
          <p className="mt-2 text-sm leading-5 text-ink-muted">
            A live document extracted from the conversation. Click a property to edit it.
          </p>
        </div>

        <WorkflowSpecPanel
          spec={spec}
          onSpecUpdate={setSpec}
        />

        <div className="mt-5 space-y-4">
          <CredentialBanner
            triggerService={spec.trigger?.service}
            actionService={spec.action?.service}
            showToast={showToast}
          />

          <SuggestionCarousel
            trigger={spec.trigger?.service}
            action={spec.action?.service}
            onSelectTemplate={handleSuggestion}
          />
        </div>

        <div className="mt-auto pt-5">
          <button
            onClick={handleDeployWorkflow}
            disabled={isLoading || !isReadyToGenerate}
            className="notion-button w-full"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            Generate & Deploy
          </button>
        </div>
      </aside>
    </div>
  );
}
