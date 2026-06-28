import React, { useEffect, useRef, useState } from 'react';

// Lightweight markdown renderer — handles bold, italic, inline-code, links, lists
function MarkdownText({ text }) {
  if (!text) return null;

  const renderInline = (line, baseKey) => {
    const parts = [];
    const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\)]+)\))/g;
    let last = 0;
    let match;
    let k = 0;
    while ((match = pattern.exec(line)) !== null) {
      if (match.index > last) parts.push(<span key={`${baseKey}-t${k++}`}>{line.slice(last, match.index)}</span>);
      if (match[2]) parts.push(<strong key={`${baseKey}-b${k++}`} className="font-semibold text-ink">{match[2]}</strong>);
      else if (match[3]) parts.push(<em key={`${baseKey}-i${k++}`}>{match[3]}</em>);
      else if (match[4]) parts.push(<code key={`${baseKey}-c${k++}`} className="rounded bg-black/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-ink">{match[4]}</code>);
      else if (match[5] && match[6]) parts.push(<a key={`${baseKey}-l${k++}`} href={match[6]} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">{match[5]}</a>);
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(<span key={`${baseKey}-e${k}`}>{line.slice(last)}</span>);
    return parts;
  };

  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  let ek = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} className="ml-4 list-decimal text-[15px] leading-7 text-ink-secondary">{renderInline(lines[i].replace(/^\d+\.\s/, ''), `ol${i}`)}</li>);
        i++;
      }
      elements.push(<ol key={ek++} className="my-1.5 space-y-0.5">{items}</ol>);
    } else if (/^[-*•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(<li key={i} className="ml-4 list-disc text-[15px] leading-7 text-ink-secondary">{renderInline(lines[i].replace(/^[-*•]\s/, ''), `ul${i}`)}</li>);
        i++;
      }
      elements.push(<ul key={ek++} className="my-1.5 space-y-0.5">{items}</ul>);
    } else if (line.trim() === '') {
      elements.push(<div key={ek++} className="h-2" />);
      i++;
    } else {
      elements.push(<p key={ek++} className="text-[15px] leading-7 text-ink-secondary">{renderInline(line, `p${ek}`)}</p>);
      i++;
    }
  }
  return <div className="space-y-0.5">{elements}</div>;
}

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

                <MarkdownText text={msg.text} />

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