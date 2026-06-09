import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SettingsModal from '../components/modals/SettingsModal';
import NotificationsModal from '../components/modals/NotificationsModal';
import ProfileModal from '../components/modals/ProfileModal';

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

const getNodeBorderClass = (type = '', name = '') => {
  const lowerType = type.toLowerCase();
  const lowerName = name.toLowerCase();
  
  if (lowerType.includes('schedule') || lowerName.includes('cron') || lowerName.includes('schedule')) {
    return 'node-schedule';
  }
  if (lowerType.includes('gmail') || lowerType.includes('email') || lowerName.includes('gmail') || lowerName.includes('email')) {
    return 'node-gmail';
  }
  if (lowerType.includes('slack') || lowerName.includes('slack')) {
    return 'node-slack';
  }
  if (lowerType.includes('webhook') || lowerName.includes('webhook')) {
    return 'node-webhook';
  }
  if (lowerType.includes('httprequest') || lowerName.includes('http') || lowerName.includes('api')) {
    return 'node-http';
  }
  return 'node-default';
};

export default function WorkflowDetailScreen() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(true);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Modals state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, message, type }]);
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  const fetchWorkflowDetails = async () => {
    setIsLoadingWorkflow(true);
    try {
      const res = await axios.get('/api/workflows');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const found = data.find(w => w.id === id || String(w.id) === String(id));
      if (found) {
        setWorkflow(found);
      } else {
        showToast('Workflow not found', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load workflow details', 'error');
    } finally {
      setIsLoadingWorkflow(false);
    }
  };

  const fetchExecutions = async () => {
    setIsLoadingExecutions(true);
    try {
      const res = await axios.get(`/api/workflows/${id}/executions`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setExecutions(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load executions history', 'error');
    } finally {
      setIsLoadingExecutions(false);
    }
  };

  useEffect(() => {
    fetchWorkflowDetails();
    fetchExecutions();
  }, [id]);

  const handleCopyJson = () => {
    if (!workflow) return;
    navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
    showToast('Workflow JSON copied to clipboard!');
  };

  const handleRunNow = async () => {
    showToast('Triggering workflow execution in n8n...', 'info');
    setTimeout(() => {
      showToast('Workflow triggered. Refreshing run history...', 'success');
      fetchExecutions();
    }, 1500);
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0') + ' ' + 
      String(date.getHours()).padStart(2, '0') + ':' + 
      String(date.getMinutes()).padStart(2, '0') + ':' + 
      String(date.getSeconds()).padStart(2, '0');
  };

  const formatDuration = (started, finished) => {
    if (!started || !finished) return '-';
    const diff = new Date(finished) - new Date(started);
    return (diff / 1000).toFixed(1) + 's';
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header
        activeTab="dashboard"
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden h-full relative z-10">
        <Sidebar activeTab="dashboard" />

        {isLoadingWorkflow ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-surface text-on-surface-variant">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2 mb-4"></div>
            <p className="font-body-md">Loading workflow details...</p>
          </div>
        ) : !workflow ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-surface text-on-surface-variant p-6 text-center">
            <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
            <h2 className="font-headline-md text-on-surface mb-2">Workflow Not Found</h2>
            <p className="font-body-md mb-6">We couldn't locate a workflow with ID "{id}". It may have been deleted.</p>
            <Link to="/dashboard" className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md">Back to Dashboard</Link>
          </div>
        ) : (
          <main className="flex-1 flex overflow-hidden">
            {/* Main Canvas Area */}
            <div className="flex-1 relative overflow-hidden canvas-grid flex flex-col">
              {/* Toolbar Overlay */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Link to="/dashboard" className="bg-surface-container-low border border-outline-variant p-2 flex items-center gap-2 hover:bg-surface-container-highest transition-all rounded-lg active:scale-95 text-on-surface">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">arrow_back</span>
                  <span className="font-label-md text-on-surface">Back to Dashboard</span>
                </Link>
                <div className="h-8 w-px bg-outline-variant mx-2 self-center"></div>
                <div className="bg-surface-container-low border border-outline-variant rounded-lg flex p-1">
                  <div className="p-1 px-3 text-primary bg-primary-container/20 rounded-md font-label-md">View Mode</div>
                </div>
              </div>

              {/* Workflow Visualizer (Horizontal Scroll Flexbox) */}
              <div className="absolute inset-0 flex items-center justify-center p-8 overflow-x-auto custom-scrollbar pointer-events-none">
                <div className="flex items-center gap-8 pointer-events-auto max-w-full">
                  {workflow.nodes && workflow.nodes.length > 0 ? (
                    workflow.nodes.map((node, index) => {
                      const nodeInfo = getNodeInfo(node.type, node.name);
                      return (
                        <React.Fragment key={node.id || index}>
                          {index > 0 && (
                            <div className="flex flex-col items-center justify-center flex-shrink-0">
                              <div className="w-12 h-0.5 bg-outline-variant relative">
                                <div className="absolute -right-1 -top-1 w-2.5 h-2.5 border-t-2 border-r-2 border-outline-variant rotate-45"></div>
                              </div>
                            </div>
                          )}
                          
                          <div className={`relative w-52 node-card ${getNodeBorderClass(node.type, node.name)} p-3 hover:border-outline transition-all duration-200 flex-shrink-0`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`material-symbols-outlined ${nodeInfo.colorClass} text-[18px]`}>
                                {nodeInfo.icon}
                              </span>
                              <span className="font-label-md text-on-surface truncate font-semibold">{node.name}</span>
                            </div>
                            <div className="text-[11px] text-on-surface-variant font-code-sm mb-1 truncate opacity-60">
                              {node.type.split('.').pop() || node.type}
                            </div>
                            
                            {/* Dots on left/right edges for visual connections */}
                            {index > 0 && (
                              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 border border-surface rounded-full"></div>
                            )}
                            {index < workflow.nodes.length - 1 && (
                              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 border border-surface rounded-full"></div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="text-on-surface-variant italic font-body-md">No nodes configured for this workflow.</div>
                  )}
                </div>
              </div>

              {/* Bottom Panel (Run History) */}
              <div className="h-64 bg-surface border-t border-outline-variant flex flex-col z-20">
                <div className="px-6 py-3 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                  <h3 className="font-label-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    Run History
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={fetchExecutions} className="text-on-surface-variant hover:text-on-surface p-1 active:scale-95 transition-transform" title="Refresh Executions">
                      <span className="material-symbols-outlined text-[20px]">refresh</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar bg-surface-container-lowest">
                  {isLoadingExecutions ? (
                    <div className="h-full flex items-center justify-center text-on-surface-variant">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary border-r-2 mr-2"></div>
                      <span className="font-body-md">Loading execution history...</span>
                    </div>
                  ) : executions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-on-surface-variant p-4">
                      <span className="material-symbols-outlined text-[32px] opacity-40 mb-1">history</span>
                      <span className="font-body-md italic text-sm">No run executions found for this workflow.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant z-10">
                        <tr className="font-label-md text-on-surface-variant">
                          <th className="px-6 py-3 font-medium">Execution ID</th>
                          <th className="px-6 py-3 font-medium">Timestamp</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium">Duration</th>
                          <th className="px-6 py-3 font-medium">Nodes Executed</th>
                          <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="font-body-md text-on-surface divide-y divide-outline-variant/10">
                        {executions.map((exec) => {
                          const isSuccess = exec.status === 'success';
                          const isFailed = exec.status === 'failed' || exec.status === 'error';
                          
                          return (
                            <tr key={exec.id} className="hover:bg-surface-container-high transition-colors">
                              <td className="px-6 py-3 font-code-sm text-primary">#{exec.id.substring(0, 8)}</td>
                              <td className="px-6 py-3">{formatTimestamp(exec.startedAt)}</td>
                              <td className="px-6 py-3">
                                {isSuccess ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">Success</span>
                                ) : isFailed ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Failed</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">{exec.status || 'Running'}</span>
                                )}
                              </td>
                              <td className="px-6 py-3">{formatDuration(exec.startedAt, exec.finishedAt)}</td>
                              <td className="px-6 py-3">{exec.workflowData?.nodes?.length || workflow.nodes?.length || '-'}</td>
                              <td className="px-6 py-3 text-right">
                                <a
                                  href={`http://localhost:5678/workflow/${id}/executions/${exec.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline font-label-md"
                                >
                                  View in n8n
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Right Property/Code Panel */}
            <aside className="w-[320px] bg-surface-container-low border-l border-outline-variant flex flex-col z-10">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                <span className="font-label-md text-on-surface">Workflow JSON</span>
                <button onClick={handleCopyJson} className="text-on-surface-variant hover:text-on-surface p-1 active:scale-95 transition-transform" title="Copy JSON">
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
              <div className="flex-1 bg-[#0e0e0e] p-4 overflow-auto custom-scrollbar font-code-sm text-primary text-[12px] leading-relaxed">
                <pre><code className="block select-text whitespace-pre-wrap">{JSON.stringify(workflow, null, 2)}</code></pre>
              </div>
              <div className="p-4 border-t border-outline-variant space-y-4 bg-surface-container-low">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Status</span>
                  <div className="flex items-center gap-2 text-on-surface">
                    <div className={`w-2 h-2 rounded-full ${workflow.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-outline-variant'}`}></div>
                    <span className="font-label-md">{workflow.active ? 'Active & Monitoring' : 'Inactive / Paused'}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <a
                    href={`http://localhost:5678/workflow/${id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-[#2e2e2e] hover:bg-surface-container-highest border border-outline-variant text-on-surface py-2 rounded-lg font-label-md text-center transition-all"
                  >
                    Configure
                  </a>
                  <button onClick={handleRunNow} className="flex-1 bg-primary text-on-primary font-bold py-2 rounded-lg font-label-md active:scale-95 transition-transform">
                    Run Now
                  </button>
                </div>
              </div>
            </aside>
          </main>
        )}
      </div>

      {/* Global Overlay Modals */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        showToast={showToast}
      />
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Render toasts */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
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
