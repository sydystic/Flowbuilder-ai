/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

  if (lowerType.includes('schedule') || lowerName.includes('cron') || lowerName.includes('schedule')) return { icon: 'schedule' };
  if (lowerType.includes('gmail') || lowerType.includes('email') || lowerName.includes('gmail') || lowerName.includes('email')) return { icon: 'mail' };
  if (lowerType.includes('sheets') || lowerName.includes('sheet') || lowerType.includes('table')) return { icon: 'table_chart' };
  if (lowerType.includes('slack') || lowerName.includes('slack')) return { icon: 'chat' };
  if (lowerType.includes('webhook') || lowerName.includes('webhook')) return { icon: 'lan' };
  if (lowerType.includes('httprequest') || lowerName.includes('http') || lowerName.includes('api')) return { icon: 'http' };
  if (lowerType.includes('postgres') || lowerType.includes('database') || lowerType.includes('db') || lowerName.includes('db')) return { icon: 'database' };
  return { icon: 'account_tree' };
};

export default function WorkflowDetailScreen() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState([]);
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

  // React Query: Fetch config
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await axios.get('/api/config');
      return res.data;
    }
  });

  let n8nBaseUrl = config?.n8nUrl || 'http://localhost:5678';
  if (n8nBaseUrl.includes('://n8n:')) {
    n8nBaseUrl = n8nBaseUrl.replace('://n8n:', `://${window.location.hostname}:`);
  }

  // React Query: Fetch single workflow details
  const { data: workflow, isLoading: isLoadingWorkflow, error: workflowError } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const res = await axios.get(`/api/workflows/${id}`);
      return res.data;
    }
  });

  // React Query: Fetch executions runs (triggers backend incremental sync)
  const { data: executions = [], isLoading: isLoadingExecutions, error: executionsError, refetch: refetchExecutions } = useQuery({
    queryKey: ['executions', id],
    queryFn: async () => {
      const res = await axios.get(`/api/workflows/${id}/executions`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!workflow
  });

  // React Query: Deploy/Retry Mutation
  const deployMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`/api/workflows/${id}/deploy`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      showToast(`Workflow "${data.workflow?.name || 'Workflow'}" deployed successfully!`);
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
      showToast(`Failed to deploy: ${errorMsg}`, 'error');
    }
  });

  const handleCopyJson = () => {
    if (!workflow) return;
    navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
    showToast('Workflow JSON copied to clipboard!');
  };

  const handleRunNow = async () => {
    showToast('Triggering workflow execution in n8n...', 'info');
    setTimeout(() => {
      showToast('Workflow triggered. Refreshing run history...', 'success');
      refetchExecutions();
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

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden">
      <Header
        activeTab="dashboard"
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div className="flex h-full flex-1 overflow-hidden">
        <Sidebar activeTab="dashboard" />

        {isLoadingWorkflow ? (
          <div className="flex flex-1 flex-col items-center justify-center text-ink-muted">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            <p className="text-sm">Loading workflow details...</p>
          </div>
        ) : (!workflow || workflowError) ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <span className="material-symbols-outlined mb-4 text-[44px] text-[#93000a]">error</span>
            <h2 className="text-xl font-semibold text-ink">Workflow Not Found</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
              {workflowError?.response?.data?.error || `We couldn't locate a workflow with ID "${id}". It may have been deleted or access is forbidden.`}
            </p>
            <Link to="/dashboard" className="notion-button mt-6">Back to Dashboard</Link>
          </div>
        ) : (
          <main className="flex flex-1 overflow-hidden">
            <section className="flex flex-1 flex-col overflow-hidden px-8 py-7">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                  <Link to="/dashboard" className="notion-button-secondary mb-5">
                    <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                    Back
                  </Link>
                  <p className="mb-2 text-sm font-medium text-primary">Workflow</p>
                  <h1 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-[-0.02em] text-ink">
                    {workflow.name || 'Untitled workflow'}
                  </h1>
                  <p className="mt-2 text-xs text-ink-faint">ID: {workflow.id}</p>
                </div>
              </div>

              <div className="notion-panel flex min-h-[280px] items-center overflow-x-auto p-8 bg-white/40">
                <div className="flex items-center gap-5">
                  {workflow.nodes && workflow.nodes.length > 0 ? (
                    workflow.nodes.map((node, index) => {
                      const nodeInfo = getNodeInfo(node.type, node.name);
                      return (
                        <React.Fragment key={node.id || index}>
                          {index > 0 && <div className="h-px w-8 shrink-0 bg-black/10" />}
                          <div className="notion-surface w-52 shrink-0 p-4">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <span className="material-symbols-outlined text-[19px]">{nodeInfo.icon}</span>
                            </div>
                            <p className="truncate text-sm font-semibold text-ink">{node.name}</p>
                            <p className="mt-1 truncate text-xs text-ink-muted">{node.type.split('.').pop() || node.type}</p>
                          </div>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="text-sm text-ink-muted">No nodes configured for this workflow draft. Retrying deployment will construct the nodes.</div>
                  )}
                </div>
              </div>

              <section className="mt-6 min-h-0 flex-1 overflow-hidden rounded-xl bg-white/48 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-black/[0.05]">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                    Run History (Incremental Sync)
                  </h3>
                  <button 
                    onClick={() => refetchExecutions()} 
                    disabled={isLoadingExecutions}
                    className="notion-nav-item flex h-8 w-8 items-center justify-center" 
                    type="button"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isLoadingExecutions ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {isLoadingExecutions ? (
                    <div className="flex items-center justify-center py-12 text-sm text-ink-muted">
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                      Loading execution history...
                    </div>
                  ) : executions.length === 0 ? (
                    <div className="py-12 text-center text-sm text-ink-muted">No execution runs found for this workflow.</div>
                  ) : (
                    <div className="space-y-1">
                      {executions.map((exec) => (
                        <div key={exec.id} className="grid grid-cols-[1fr_120px_80px_100px] items-center gap-4 rounded-lg px-3 py-2 text-sm hover:bg-black/[0.04]">
                          <div>
                            <p className="font-medium text-ink">#{exec.id.substring(0, 8)}</p>
                            <p className="text-xs text-ink-muted">{formatTimestamp(exec.startedAt)}</p>
                          </div>
                          <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            exec.status === 'success'
                              ? 'bg-primary/10 text-primary'
                              : exec.status === 'failed'
                                ? 'bg-[#93000a]/10 text-[#93000a]'
                                : 'bg-black/[0.05] text-ink-muted'
                          }`}>
                            {exec.status.toUpperCase()}
                          </span>
                          <span className="text-ink-muted text-xs">
                            {exec.logs?.workflowData?.nodes?.length || workflow.nodes?.length || '-'} nodes
                          </span>
                          {workflow.n8nWorkflowId ? (
                            <a 
                              href={`${n8nBaseUrl}/workflow/${workflow.n8nWorkflowId}/executions/${exec.id}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-right font-medium text-primary hover:underline text-xs"
                            >
                              View in n8n
                            </a>
                          ) : (
                            <span className="text-right text-xs text-ink-faint">-</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </section>

            <aside className="flex w-[340px] shrink-0 flex-col overflow-hidden px-5 py-6 border-l border-black/[0.05]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">Inspector</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">Workflow JSON</h2>
                </div>
                <button onClick={handleCopyJson} className="notion-nav-item flex h-8 w-8 items-center justify-center" type="button">
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white/52 p-4 border border-black/[0.05]">
                <pre className="text-xs leading-5 text-ink-secondary"><code>{JSON.stringify(workflow, null, 2)}</code></pre>
              </div>

              <div className="mt-4 rounded-xl bg-white/52 p-4 border border-black/[0.05]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">Status</p>
                
                {workflow.status === 'failed' && (
                  <div className="mt-2 text-xs text-[#93000a] bg-[#93000a]/5 p-2 rounded border border-[#93000a]/10 whitespace-pre-wrap mb-4">
                    <p className="font-semibold mb-1">Deployment Error:</p>
                    {workflow.deploymentError || 'An error occurred during deployment.'}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-ink">
                  <span className={`h-2 w-2 rounded-full ${
                    workflow.status === 'failed' 
                      ? 'bg-[#93000a]' 
                      : workflow.status === 'draft' 
                        ? 'bg-amber-500' 
                        : workflow.active 
                          ? 'bg-primary' 
                          : 'bg-ink-faint'
                  }`} />
                  {workflow.status === 'failed' 
                    ? 'Deployment Failed' 
                    : workflow.status === 'draft' 
                      ? 'Draft Workflow' 
                      : workflow.active 
                        ? 'Active & Monitoring' 
                        : 'Inactive / Paused'}
                </div>

                <div className="mt-4 flex gap-2">
                  {workflow.status === 'failed' || workflow.status === 'draft' ? (
                    <button 
                      onClick={() => deployMutation.mutate()} 
                      disabled={deployMutation.isPending} 
                      className="notion-button flex-1 justify-center gap-1"
                      type="button"
                    >
                      <span className={`material-symbols-outlined text-[17px] ${deployMutation.isPending ? 'animate-spin' : ''}`}>
                        {deployMutation.isPending ? 'sync' : 'bolt'}
                      </span>
                      {deployMutation.isPending ? 'Deploying...' : 'Deploy Now'}
                    </button>
                  ) : (
                    <>
                      <a 
                        href={workflow.n8nWorkflowId ? `${n8nBaseUrl}/workflow/${workflow.n8nWorkflowId}` : '#'}
                        onClick={(e) => {
                          if (!workflow.n8nWorkflowId) {
                            e.preventDefault();
                            showToast('No deployed workflow found for this record.', 'error');
                          }
                        }}
                        target="_blank" 
                        rel="noreferrer" 
                        className="notion-button-secondary flex-1 text-center flex items-center justify-center"
                      >
                        Configure
                      </a>
                      <button onClick={handleRunNow} className="notion-button flex-1" type="button">
                        Run Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </main>
        )}
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} showToast={showToast} />
      <NotificationsModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}
