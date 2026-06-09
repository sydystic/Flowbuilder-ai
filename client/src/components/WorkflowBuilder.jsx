import React from 'react';
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
  
  // Determine phase based on ready state and message characteristics
  const getPhase = () => {
    if (isReadyToGenerate) return 'ready';
    
    // Check if trigger or action are partially populated
    const hasTrigger = spec.trigger?.service && spec.trigger.service !== '[unknown]';
    const hasAction = spec.action?.service && spec.action.service !== '[unknown]';
    
    if (hasTrigger && hasAction) return 'building';
    if (hasTrigger || hasAction) return 'suggesting';
    return 'exploring';
  };

  const currentPhase = getPhase();

  // Find remaining questions count
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
    <div className="flex flex-1 overflow-hidden h-full">
      {/* LEFT PANE: Structured Conversation */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d16]/30 border-r border-outline-variant">
        <ConversationHeader
          phase={currentPhase}
          questionsRemaining={remainingQuestions}
        />
        
        {messages.length === 0 && !activeSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center canvas-bg">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[32px]">auto_awesome</span>
            </div>
            <h2 className="font-headline-lg text-[22px] text-on-surface font-bold mb-2">What automation can I build for you?</h2>
            <p className="text-on-surface-variant font-body-md text-body-md mb-8 max-w-md">
              Describe any automation in plain English — I'll ask clarifying questions if needed, then generate and deploy a working n8n workflow.
            </p>
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

      {/* RIGHT PANE: Live Workflow Specification */}
      <div className="w-[340px] h-full bg-[#0a0a14] flex flex-col p-5 overflow-y-auto z-20 gap-5 custom-scrollbar flex-shrink-0">
        <div>
          <h3 className="font-headline-md text-[16px] text-on-surface font-bold mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
            Workflow Spec
          </h3>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Evolving configuration extracted from your conversation. Click fields to edit directly.
          </p>
        </div>

        {/* WorkflowSpecPanel with inline edits */}
        <WorkflowSpecPanel
          spec={spec}
          onSpecUpdate={setSpec}
        />

        {/* Dynamic credential warning banners */}
        <CredentialBanner
          triggerService={spec.trigger?.service}
          actionService={spec.action?.service}
          showToast={showToast}
        />

        {/* Dynamic suggestion variations cards */}
        <SuggestionCarousel
          trigger={spec.trigger?.service}
          action={spec.action?.service}
          onSelectTemplate={handleSuggestion}
        />

        {/* Generation Action button */}
        <div className="mt-auto pt-4 border-t border-outline-variant/30 flex flex-col gap-2">
          <button
            onClick={handleDeployWorkflow}
            disabled={isLoading || !isReadyToGenerate}
            className="w-full flex items-center justify-center gap-2 btn-primary py-2.5 rounded-lg text-xs font-bold text-white shadow-lg active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:shadow-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            Generate & Deploy
          </button>
        </div>
      </div>
    </div>
  );
}
