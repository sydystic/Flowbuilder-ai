import React, { useEffect, useRef } from 'react';
import MessageBubble from '../../screens/ChatScreen'; // Wait, let's write the MessageBubble rendering logic directly here to keep it independent!
import { Link } from 'react-router-dom';

// Copying helper function and node diagram here so ConversationHistory is modular
const getNodeInfo = (type = '', name = '') => {
  const t = type.toLowerCase(); const n = name.toLowerCase();
  if (t.includes('schedule') || n.includes('cron') || n.includes('schedule')) return { icon: 'schedule', colorClass: 'text-primary' };
  if (t.includes('gmail') || t.includes('email') || n.includes('gmail') || n.includes('email')) return { icon: 'mail', colorClass: 'text-red-400' };
  if (t.includes('sheets') || n.includes('sheet') || t.includes('table')) return { icon: 'table_chart', colorClass: 'text-green-400' };
  if (t.includes('slack') || n.includes('slack')) return { icon: 'chat', colorClass: 'text-purple-400' };
  if (t.includes('webhook') || n.includes('webhook')) return { icon: 'lan', colorClass: 'text-amber-400' };
  if (t.includes('httprequest') || n.includes('http') || n.includes('api')) return { icon: 'http', colorClass: 'text-teal-400' };
  if (t.includes('postgres') || t.includes('database') || t.includes('db') || n.includes('db')) return { icon: 'database', colorClass: 'text-blue-400' };
  return { icon: 'account_tree', colorClass: 'text-outline' };
};

function LocalWorkflowDiagram({ workflow, n8nId }) {
  if (!workflow || !workflow.nodes) return null;
  return (
    <div className="mt-5">
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex items-center justify-start gap-4 overflow-x-auto min-h-[140px] custom-scrollbar">
        {workflow.nodes.map((node, idx) => {
          const isLast = idx === workflow.nodes.length - 1;
          const nodeInfo = getNodeInfo(node.type, node.name);
          return (
            <React.Fragment key={node.id || idx}>
              <div className="relative z-10 w-44 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg shadow-lg hover:border-primary transition-colors cursor-pointer flex-shrink-0">
                <div className="p-2 border-b border-[#2e2e2e] flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[14px] ${nodeInfo.colorClass}`}>{nodeInfo.icon}</span>
                  <span className="font-label-md text-[11px] text-on-surface truncate flex-1">{node.type.split('.').pop()}</span>
                </div>
                <div className="p-3">
                  <p className="font-label-md text-[12px] text-on-surface font-bold truncate">{node.name}</p>
                </div>
                {idx > 0 && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border border-surface" />}
                {!isLast && <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border border-surface shadow-[0_0_8px_rgba(173,198,255,0.6)]" />}
              </div>
              {!isLast && <div className="w-6 h-[2px] bg-outline-variant flex-shrink-0 z-0" />}
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-4 flex gap-3">
        {n8nId && (
          <Link to={`/workflow/${n8nId}`} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded font-label-md text-label-md font-bold active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            View Details
          </Link>
        )}
        <a href="http://localhost:5678" target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-outline-variant text-on-surface px-4 py-2 rounded font-label-md text-label-md hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          View in n8n
        </a>
      </div>
    </div>
  );
}

function LocalClarifyingQuestions({ questions, onAnswered }) {
  const [answers, setAnswers] = React.useState(Array(questions.length).fill(''));
  const allAnswered = answers.every(a => a.trim().length > 0);

  return (
    <div className="mt-4 bg-[#1a1a2e] border border-primary/30 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-[18px]">help_outline</span>
        <span className="font-label-md text-primary font-bold text-sm">A few quick questions to build the perfect workflow:</span>
      </div>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i}>
            <label className="block text-[13px] text-on-surface mb-1.5 font-medium">{i + 1}. {q}</label>
            <input
              type="text"
              value={answers[i]}
              onChange={e => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
              }}
              placeholder="Your answer..."
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-surface text-[13px] focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => allAnswered && onAnswered(questions, answers)}
        disabled={!allAnswered}
        className="mt-5 flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-lg font-label-md font-bold active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100"
      >
        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
        Update Specification
      </button>
    </div>
  );
}

export default function ConversationHistory({ messages, onAnswerClarify, onSelectTemplate, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 message-scroll custom-scrollbar">
      {messages.map((msg, index) => {
        const isUser = msg.sender === 'user';
        
        if (isUser) {
          return (
            <div key={msg.id || index} className="flex justify-end animate-fade-in">
              <div className="max-w-[80%] bg-surface-container-high border border-outline-variant p-4 rounded-xl rounded-tr-none text-on-surface font-body-md text-body-md whitespace-pre-line shadow-md">
                {msg.text}
              </div>
            </div>
          );
        }

        // Assistant Message
        return (
          <div key={msg.id || index} className="flex justify-start animate-fade-in">
            <div className="max-w-[90%] w-full bg-[#1a1a1a] border border-[#2e2e2e] p-6 rounded-xl rounded-tl-none shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[16px]">auto_awesome</span>
                </div>
                <span className="font-label-md text-label-md text-primary font-bold">FlowBuilder AI</span>
                {msg.messageType === 'clarifying_question' && (
                  <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20 tracking-wider">CLARIFYING</span>
                )}
              </div>
              <p className="text-body-md font-body-md text-on-surface whitespace-pre-line leading-relaxed">{msg.text}</p>

              {msg.messageType === 'clarifying_question' && msg.questions && !msg.answered && (
                <LocalClarifyingQuestions 
                  questions={msg.questions} 
                  onAnswered={(qs, as) => onAnswerClarify(msg.id, qs, as)} 
                />
              )}

              {msg.workflow && msg.workflow.nodes && (
                <LocalWorkflowDiagram workflow={msg.workflow} n8nId={msg.n8nId} />
              )}

              {msg.workflow?.suggestedTemplates?.length > 0 && (
                <div className="mt-4 border-t border-outline-variant/30 pt-3">
                  <div className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Suggested Templates:</div>
                  <div className="flex flex-wrap gap-2">
                    {msg.workflow.suggestedTemplates.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectTemplate(t)}
                        className="text-[11px] font-label-md text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 px-3 py-1.5 rounded-full transition-all text-left cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[85%] w-full bg-[#1a1a1a] border border-[#2e2e2e] p-6 rounded-xl rounded-tl-none shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[16px] animate-spin">autorenew</span>
              </div>
              <span className="font-label-md text-label-md text-primary font-bold">
                FlowBuilder AI is architecting…
              </span>
            </div>
            <div className="flex space-x-2">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
