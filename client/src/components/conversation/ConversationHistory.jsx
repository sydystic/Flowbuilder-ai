import React, { useEffect, useRef, useState } from 'react';

export default function ConversationHistory({ messages, onAnswerClarify, onSelectTemplate, isLoading }) {
  const bottomRef = useRef(null);
  const [clarifyingAnswers, setClarifyingAnswers] = useState({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const updateClarifyingAnswer = (messageId, index, value) => {
    setClarifyingAnswers(prev => ({
      ...prev,
      [messageId]: {
        ...(prev[messageId] || {}),
        [index]: value,
      },
    }));
  };

  const submitClarifyingAnswers = (messageId, questions) => {
    const answersByIndex = clarifyingAnswers[messageId] || {};
    const answers = questions.map((_, index) => (answersByIndex[index] || '').trim());

    onAnswerClarify(messageId, questions, answers);
  };

  return (
    <div className="message-scroll flex-1 overflow-y-auto py-8">
      <div className="mx-auto max-w-3xl space-y-7">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';

          if (isUser) {
            return (
              <div key={msg.id || index} className="animate-fade-in flex justify-end">
                <div className="max-w-[78%] rounded-xl bg-white px-4 py-3 text-[15px] leading-6 text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            );
          }

          return (
            <article key={msg.id || index} className="animate-fade-in flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[17px]">auto_awesome</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">FlowBuilder AI</span>
                  {msg.messageType === 'clarifying_question' && (
                    <span className="notion-chip">Clarifying</span>
                  )}
                </div>

                <p className="whitespace-pre-line text-[15px] leading-7 text-ink-secondary">{msg.text}</p>

                {msg.messageType === 'clarifying_question' && msg.questions && !msg.answered && (
                  <div className="mt-4 rounded-xl bg-white/72 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <p className="mb-3 text-sm font-semibold text-ink">Quick answers</p>
                    <div className="space-y-3">
                      {msg.questions.map((q, i) => (
                        <label key={i} className="block">
                          <span className="mb-1 block text-sm text-ink-muted">{i + 1}. {q}</span>
                          <input
                            type="text"
                            value={clarifyingAnswers[msg.id]?.[i] || ''}
                            onChange={(event) => updateClarifyingAnswer(msg.id, i, event.target.value)}
                            className="notion-input"
                            placeholder="Type an answer"
                          />
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => submitClarifyingAnswers(msg.id, msg.questions)}
                      className="notion-button mt-4"
                      type="button"
                    >
                      Update Specification
                    </button>
                  </div>
                )}

                {msg.workflow && msg.workflow.nodes && (
                  <div className="mt-4 flex items-center gap-3 overflow-x-auto rounded-xl bg-white/56 p-3">
                    {msg.workflow.nodes.map((node, idx) => {
                      const isLast = idx === msg.workflow.nodes.length - 1;
                      return (
                        <React.Fragment key={node.id || idx}>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[18px]">account_tree</span>
                          </div>
                          {!isLast && <div className="h-px w-6 shrink-0 bg-black/10" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {msg.workflow?.suggestedTemplates?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.workflow.suggestedTemplates.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectTemplate(t)}
                        className="rounded-full bg-white/70 px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-white hover:text-primary"
                        type="button"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {isLoading && (
          <article className="flex gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined animate-spin text-[17px]">autorenew</span>
            </div>
            <div className="pt-0.5 text-sm text-ink-muted">FlowBuilder AI is architecting...</div>
          </article>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
