import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';

const getNodeInfo = (type = '', name = '') => {
  const lowerType = type.toLowerCase();
  const lowerName = name.toLowerCase();
  
  if (lowerType.includes('schedule') || lowerName.includes('cron') || lowerName.includes('schedule')) {
    return { icon: 'schedule', colorClass: 'text-primary' };
  }
  if (lowerType.includes('gmail') || lowerType.includes('email') || lowerName.includes('gmail') || lowerName.includes('email')) {
    return { icon: 'mail', colorClass: 'text-red-400' };
  }
  if (lowerType.includes('sheets') || lowerName.includes('sheet') || lowerType.includes('table')) {
    return { icon: 'table_chart', colorClass: 'text-green-400' };
  }
  if (lowerType.includes('slack') || lowerName.includes('slack')) {
    return { icon: 'chat', colorClass: 'text-purple-400' };
  }
  if (lowerType.includes('webhook') || lowerName.includes('webhook')) {
    return { icon: 'lan', colorClass: 'text-amber-400' };
  }
  if (lowerType.includes('httprequest') || lowerName.includes('http') || lowerName.includes('api')) {
    return { icon: 'http', colorClass: 'text-teal-400' };
  }
  if (lowerType.includes('postgres') || lowerType.includes('database') || lowerType.includes('db') || lowerName.includes('db')) {
    return { icon: 'database', colorClass: 'text-blue-400' };
  }
  return { icon: 'account_tree', colorClass: 'text-outline' };
};

export default function ChatScreen() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'mock-1',
      sender: 'user',
      text: 'Generate a workflow that triggers whenever a new row is added to a Google Sheet, then sends a personalized email via Gmail and finally updates the row status in the sheet.'
    },
    {
      id: 'mock-2',
      sender: 'ai',
      text: "I've architected a 3-node workflow for this integration. The logic handles row detection, template mapping, and state management.",
      workflow: {
        name: "Google Sheets Sync",
        nodes: [
          { id: '1', name: 'Google Sheets Trigger', type: 'n8n-nodes-base.googleSheetsTrigger' },
          { id: '2', name: 'Send Gmail Email', type: 'n8n-nodes-base.gmail' },
          { id: '3', name: 'Update Sheet Row', type: 'n8n-nodes-base.googleSheets' }
        ]
      }
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);
  const [toasts, setToasts] = useState([]);
  const messagesEndRef = useRef(null);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchRecentHistory = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/workflows');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setRecentHistory(data);
    } catch (err) {
      console.error('Failed to fetch workflows', err);
    }
  };

  useEffect(() => {
    fetchRecentHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: prompt
    };

    setMessages(prev => [...prev, userMsg]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:3001/api/workflows/generate', {
        prompt: currentPrompt
      });

      if (res.data.success) {
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `I've architected a ${res.data.workflow.nodes.length}-node workflow for this integration: "${res.data.workflowName}".`,
          workflow: res.data.workflow,
          n8nId: res.data.n8nId
        };
        setMessages(prev => [...prev, aiMsg]);
        showToast('Workflow generated and deployed successfully!');
        fetchRecentHistory();
      } else {
        throw new Error(res.data.error || 'AI generation failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Sorry, I encountered an error while generating the workflow: ${errorMsg}`
      };
      setMessages(prev => [...prev, aiMsg]);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* TopNavBar is expected to be rendered in App.jsx layout, but since Stitch embeds it, we keep it here or layout */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TopNavBar */}
        <header className="flex justify-between items-center h-16 px-margin-desktop w-full sticky z-50 bg-surface border-b border-outline-variant">
          <div className="flex items-center gap-4">
            <img alt="FlowBuilder AI Logo" className="h-8 w-8" src="data:image/png;base64,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" />
            <span className="font-headline-md text-headline-md text-on-surface">FlowBuilder AI</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex gap-4">
              <Link className="text-on-surface font-label-md bg-surface-container-high px-3 py-2 rounded" to="/">Chat</Link>
              <Link className="text-on-surface-variant font-label-md hover:bg-surface-container-high transition-colors duration-200 px-3 py-2" to="/dashboard">Dashboard</Link>
            </nav>
            <div className="h-8 w-px bg-outline-variant"></div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors duration-200">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors duration-200">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
            <div className="h-8 w-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant">
              <img className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkWlDbCQnjRS8tZsr_5JP_S3UqPb3KjB55ThqKgI9G17LBBvW9bA7xHncGQe-s2UtATJPfqBbITMBH_j3WXc9GcY5GjdtxlCAarjAuzgi5Q0oZvzyhOYhlYkYIbrs526etpTdW1FAzOKUaM5d44N8P6Iaq2ipUorVOBi2uA8zJNhXIvYOHpM_Qcgkyiu_ctlJt_9okTfAkd0MJHs0zgnTEyI4CwIxggOCvjylNKySUHoSaBRDnFWQybPnXuz72ncNwbQ7zN6TwAIg7" alt="User avatar" />
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden h-full">
          {/* SideNavBar / Workflow History */}
          <aside className="w-[260px] h-full bg-surface-container-low border-r border-outline-variant flex flex-col py-6 px-4 gap-node-gap overflow-y-auto">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary">account_tree</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-[16px] text-on-surface">Flow Engine</h2>
                  <p className="font-label-md text-[11px] text-on-surface-variant opacity-70 uppercase tracking-widest">v2.4.0 Active</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="p-3 bg-primary-container text-on-primary-container rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                  <span className="material-symbols-outlined">chat</span>
                  <span className="font-label-md text-label-md">Current Chat</span>
                </div>
                
                <div className="mt-8 mb-2 px-2 text-[10px] font-bold text-outline uppercase tracking-widest">Recent Workflows</div>
                
                {/* History Items */}
                <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {recentHistory.map((wf) => (
                    <Link
                      key={wf.id}
                      to={`/workflow/${wf.id}`}
                      className="block p-3 hover:bg-surface-container-highest transition-all rounded-lg border border-transparent hover:border-outline-variant"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-label-md text-label-md text-on-surface truncate flex-1">{wf.name}</span>
                        <div className={`px-1 rounded text-[8px] font-bold border ${wf.active ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-outline/50 text-outline bg-surface-container'}`}>
                          {wf.active ? 'ACTIVE' : 'OFF'}
                        </div>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1">ID: {wf.id}</p>
                    </Link>
                  ))}
                  {recentHistory.length === 0 && (
                    <p className="text-xs text-on-surface-variant px-2 italic">No workflows built yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-outline-variant space-y-1">
              <a 
                href="http://localhost:5678" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 p-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined">open_in_new</span>
                <span className="font-label-md text-label-md">View in n8n</span>
              </a>
              <div className="flex items-center gap-3 p-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all rounded-lg cursor-pointer">
                <span className="material-symbols-outlined">help</span>
                <span className="font-label-md text-label-md">Help</span>
              </div>
            </div>
          </aside>

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col relative canvas-bg overflow-hidden h-full">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-8 message-scroll space-y-8 h-full">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] ${
                    msg.sender === 'user' 
                      ? 'bg-surface-container-high border border-outline-variant p-4 rounded-xl rounded-tr-none' 
                      : 'w-full bg-[#1a1a1a] border border-[#2e2e2e] p-6 rounded-xl rounded-tl-none shadow-2xl'
                  }`}>
                    {msg.sender === 'ai' && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-primary text-[16px] font-bold">auto_awesome</span>
                        </div>
                        <span className="font-label-md text-label-md text-primary font-bold">FlowBuilder AI</span>
                      </div>
                    )}
                    <p className="text-body-md font-body-md text-on-surface">{msg.text}</p>
                    
                    {/* Render Workflow Node Diagram */}
                    {msg.sender === 'ai' && msg.workflow && msg.workflow.nodes && (
                      <div className="mt-6">
                        <div className="relative bg-surface-container-lowest border border-outline-variant rounded-lg p-8 flex items-center justify-around gap-4 overflow-x-auto min-h-[160px] custom-scrollbar">
                          {msg.workflow.nodes.map((node, idx) => {
                            const isLast = idx === msg.workflow.nodes.length - 1;
                            const nodeInfo = getNodeInfo(node.type, node.name);
                            return (
                              <React.Fragment key={node.id || idx}>
                                <div className="relative z-10 w-44 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg shadow-lg hover:border-primary transition-colors cursor-pointer group flex-shrink-0">
                                  <div className="p-2 border-b border-[#2e2e2e] flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[14px] ${nodeInfo.colorClass}`}>
                                      {nodeInfo.icon}
                                    </span>
                                    <span className="font-label-md text-[11px] text-on-surface truncate flex-1">
                                      {node.type.split('.').pop()}
                                    </span>
                                  </div>
                                  <div className="p-3">
                                    <p className="font-label-md text-[12px] text-on-surface font-bold truncate">
                                      {node.name}
                                    </p>
                                    <p className="text-[10px] text-on-surface-variant mt-1 truncate">
                                      Pos: {node.position ? `${node.position[0]}, ${node.position[1]}` : 'default'}
                                    </p>
                                  </div>
                                  {idx > 0 && (
                                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border border-surface"></div>
                                  )}
                                  {!isLast && (
                                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border border-surface shadow-[0_0_8px_rgba(173,198,255,0.6)]"></div>
                                  )}
                                </div>
                                {!isLast && (
                                  <div className="w-8 h-[2px] bg-outline-variant flex-shrink-0 z-0"></div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                        
                        <div className="mt-6 flex gap-3">
                          {msg.n8nId && (
                            <Link 
                              to={`/workflow/${msg.n8nId}`}
                              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded font-label-md text-label-md font-bold active:scale-95 transition-transform"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                              View Details
                            </Link>
                          )}
                          <a 
                            href="http://localhost:5678" 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 border border-outline-variant text-on-surface px-4 py-2 rounded font-label-md text-label-md hover:bg-surface-container-high transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            View in n8n
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[85%] w-full bg-[#1a1a1a] border border-[#2e2e2e] p-6 rounded-xl rounded-tl-none shadow-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary text-[16px] font-bold animate-spin">autorenew</span>
                      </div>
                      <span className="font-label-md text-label-md text-primary font-bold">FlowBuilder AI is architecting...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs text-on-surface-variant">Generating node parameters, mapping ports, and deploying to n8n...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-surface border-t border-outline-variant">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                <div className="flex items-end gap-3 bg-surface-container p-4 rounded-xl border border-outline-variant focus-within:border-primary focus-within:shadow-[0_0_15px_rgba(173,198,255,0.15)] transition-all">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder-on-surface-variant/50 resize-none py-2 font-body-md text-body-md outline-none"
                    placeholder="Describe your next automation (e.g. daily slack report, lead sheet sync...)"
                    rows={1}
                    disabled={isLoading}
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <button 
                      type="submit"
                      disabled={isLoading || !prompt.trim()}
                      className="bg-primary text-on-primary px-6 py-2.5 rounded font-label-md text-label-md font-bold flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100"
                    >
                      <span>Generate Workflow</span>
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-2 px-2 text-center opacity-50">
                  FlowBuilder AI can create, debug and deploy n8n workflows from natural language.
                </p>
              </form>
            </div>
          </main>
        </div>
      </div>

      {/* Render Toasts */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
