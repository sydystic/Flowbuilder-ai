import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import Toast from '../components/Toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import WorkflowBuilder from '../components/WorkflowBuilder';
import SettingsModal from '../components/modals/SettingsModal';
import NotificationsModal from '../components/modals/NotificationsModal';
import ProfileModal from '../components/modals/ProfileModal';

// ── helpers ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

import { useSearchParams } from 'react-router-dom';

export default function ChatScreen() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSessionId = searchParams.get('c');

  const setActiveSessionId = (id) => {
    if (id) {
      setSearchParams({ c: id });
    } else {
      setSearchParams({});
    }
  };

  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [recentWorkflows, setRecentWorkflows] = useState([]);

  // Modals state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Evolving Spec states
  const [spec, setSpec] = useState({
    trigger: { service: "[unknown]", event: "[unknown]", sheetName: "[unknown]", details: "[unknown]" },
    action: { service: "[unknown]", action: "[unknown]", channel: "[unknown]", details: "[unknown]" }
  });
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);

  const showToast = (message, type = 'success') => {
    const id = uid();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = id => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Load sessions on mount ──
  useEffect(() => {
    loadSessions();
    fetchRecentWorkflows();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await axios.get(`/api/chat/sessions`);
      setSessions(res.data.sessions || []);
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
  };

  const fetchRecentWorkflows = async () => {
    try {
      const res = await axios.get(`/api/workflows`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setRecentWorkflows(data.slice(0, 8));
    } catch (e) { /* silent */ }
  };

  // ── Load messages when session changes ──
  useEffect(() => {
    if (!activeSessionId) return;
    loadMessages(activeSessionId);
  }, [activeSessionId]);

  const loadMessages = async (sessionId) => {
    try {
      const res = await axios.get(`/api/chat/sessions/${sessionId}/messages`);
      const msgs = res.data.messages || [];
      setMessages(msgs.map(m => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        workflow: m.workflow,
        n8nId: m.n8nId,
        messageType: m.messageType || 'message',
        questions: m.workflow?.questions || null,
        answered: m.messageType === 'clarifying_question' ? !msgs.some(x => x.message_type === 'clarifying_answer' && x.session_id === sessionId && x.created_at > m.created_at) ? false : true : undefined,
      })));

      // Extract spec from the last message with spec metadata
      const specMsg = [...msgs].reverse().find(m => m.workflow?.spec);
      if (specMsg && specMsg.workflow.spec) {
        setSpec(specMsg.workflow.spec);
        setIsReadyToGenerate(specMsg.workflow.isReadyToGenerate || false);
      } else {
        const specRes = await axios.get(`/api/chat/sessions/${sessionId}/spec`);
        if (specRes.data.success && specRes.data.spec) {
          setSpec(specRes.data.spec);
        } else {
          setSpec({
            trigger: { service: "[unknown]", event: "[unknown]", sheetName: "[unknown]", details: "[unknown]" },
            action: { service: "[unknown]", action: "[unknown]", channel: "[unknown]", details: "[unknown]" }
          });
        }
        setIsReadyToGenerate(false);
      }
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  };

  // ── New session ──
  const newSession = async () => {
    try {
      const res = await axios.post(`/api/chat/sessions`, { title: 'New Chat' });
      const session = res.data.session;
      setSessions(prev => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      setSpec({
        trigger: { service: "[unknown]", event: "[unknown]", sheetName: "[unknown]", details: "[unknown]" },
        action: { service: "[unknown]", action: "[unknown]", channel: "[unknown]", details: "[unknown]" }
      });
      setIsReadyToGenerate(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (e) {
      showToast('Failed to create new chat', 'error');
    }
  };

  // ── Select session ──
  const selectSession = (id) => {
    setActiveSessionId(id);
  };

  // ── Delete session ──
  const deleteSession = async (id) => {
    try {
      await axios.delete(`/api/chat/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
        setSpec({
          trigger: { service: "[unknown]", event: "[unknown]", sheetName: "[unknown]", details: "[unknown]" },
          action: { service: "[unknown]", action: "[unknown]", channel: "[unknown]", details: "[unknown]" }
        });
        setIsReadyToGenerate(false);
      }
    } catch (e) { showToast('Failed to delete chat', 'error'); }
  };

  // ── Rename session ──
  const renameSession = async (id, title) => {
    try {
      await axios.patch(`/api/chat/sessions/${id}`, { title });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (e) { /* silent */ }
  };

  // ── Persist message to DB ──
  const persistMessage = async (sessionId, msg) => {
    try {
      await axios.post(`/api/chat/sessions/${sessionId}/messages`, msg);
    } catch (e) { console.error('Failed to persist message', e); }
  };

  // ── Auto-rename session from first user message ──
  const autoRenameSession = async (sessionId, text) => {
    const title = text.length > 45 ? text.slice(0, 45) + '…' : text;
    await renameSession(sessionId, title);
  };

  // ── Add message to local state ──
  const addMsg = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  // ── Ensure we have an active session before sending ──
  const ensureSession = async () => {
    if (activeSessionId) return activeSessionId;
    const res = await axios.post(`/api/chat/sessions`, { title: 'New Chat' });
    const session = res.data.session;
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(session.id);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    return session.id;
  };

  // ── Main send handler ──
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const currentPrompt = prompt.trim();
    setPrompt('');

    const sessionId = await ensureSession();

    // Auto-rename first message
    const sessionTitle = sessions.find(s => s.id === sessionId)?.title;
    if (!sessionTitle || sessionTitle === 'New Chat') {
      await autoRenameSession(sessionId, currentPrompt);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: currentPrompt.slice(0, 45) } : s));
    }

    const userMsg = { id: uid(), sender: 'user', text: currentPrompt, messageType: 'message' };
    addMsg(userMsg);

    setIsLoading(true);
    try {
      const res = await axios.post(`/api/chat/sessions/${sessionId}/messages`, { text: currentPrompt });
      if (res.data.success) {
        const aiMsg = {
          id: res.data.aiMessage.id,
          sender: 'ai',
          text: res.data.aiMessage.text,
          messageType: res.data.aiMessage.messageType,
          workflow: res.data.aiMessage.workflow,
          n8nId: res.data.aiMessage.n8nId,
        };
        addMsg(aiMsg);

        if (res.data.spec) {
          setSpec(res.data.spec);
          setIsReadyToGenerate(res.data.aiMessage.workflow?.isReadyToGenerate || false);
        }
      } else {
        throw new Error(res.data.error || 'Server error');
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
      const failMsg = { id: uid(), sender: 'ai', text: `Sorry, I hit an error: ${errorMsg}`, messageType: 'message' };
      addMsg(failMsg);
      await persistMessage(activeSessionId, failMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle clarifying answers submitted ──
  const handleAnswerClarify = async (clarifyMsgId, questions, answers) => {
    const clarifyMsg = messages.find(m => m.id === clarifyMsgId);
    if (!clarifyMsg) return;

    const sessionId = await ensureSession();

    // Mark the question message as answered locally
    setMessages(prev => prev.map(m => m.id === clarifyMsgId ? { ...m, answered: true } : m));

    // Build QA context
    const qaContext = questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n');
    const displayAnswers = answers.map((a, i) => `${questions[i]}: ${a}`).join(' · ');

    const userMsg = { id: uid(), sender: 'user', text: displayAnswers, messageType: 'clarifying_answer' };
    addMsg(userMsg);

    // Save user message in history
    await persistMessage(sessionId, userMsg);

    setIsLoading(true);
    try {
      const res = await axios.post(`/api/chat/sessions/${sessionId}/messages`, { text: qaContext });
      if (res.data.success) {
        const aiMsg = {
          id: res.data.aiMessage.id,
          sender: 'ai',
          text: res.data.aiMessage.text,
          messageType: res.data.aiMessage.messageType,
          workflow: res.data.aiMessage.workflow,
          n8nId: res.data.aiMessage.n8nId,
        };
        addMsg(aiMsg);

        if (res.data.spec) {
          setSpec(res.data.spec);
          setIsReadyToGenerate(res.data.aiMessage.workflow?.isReadyToGenerate || false);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to submit clarification answers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle template/suggestion selection ──
  const handleSuggestion = (text) => {
    setPrompt(text);
  };

  // ── Deploy Evolving Workflow ──
  const handleDeployWorkflow = async () => {
    if (!activeSessionId) return;
    setIsLoading(true);
    showToast('Architecting workflow JSON...');

    try {
      const summaryPrompt = `Create a complete n8n workflow for this spec:
Trigger: ${spec.trigger.service} (Event: ${spec.trigger.event}, Source/Sheet: ${spec.trigger.sheetName}, Details: ${spec.trigger.details})
Action: ${spec.action.service} (Action: ${spec.action.action}, Target/Channel: ${spec.action.channel}, Details: ${spec.action.details})`;

      const res = await axios.post(`/api/workflows/generate`, { prompt: summaryPrompt, spec });
      if (res.data.success) {
        const deployMsg = {
          id: uid(),
          sender: 'ai',
          text: `Deploy complete! I have generated and activated the workflow "${res.data.workflowName}" in your n8n workspace.`,
          workflow: res.data.workflow,
          n8nId: res.data.n8nId,
          messageType: 'workflow',
        };
        addMsg(deployMsg);
        await persistMessage(activeSessionId, deployMsg);
        showToast('Workflow generated and deployed!');
        if (window.addFlowBuilderNotification) {
          window.addFlowBuilderNotification('success', 'Workflow generated & deployed', `Generated and activated "${res.data.workflowName || 'Workflow'}" in n8n.`);
        }
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
      } else {
        throw new Error(res.data.error || 'Failed to deploy workflow');
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.message || 'Generation failed';
      const failMsg = { id: uid(), sender: 'ai', text: `Sorry, I hit an error: ${errorMsg}`, messageType: 'message' };
      addMsg(failMsg);
      await persistMessage(activeSessionId, failMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Save Spec manually updated on spec panel
  const handleSpecUpdate = async (newSpec) => {
    setSpec(newSpec);
    if (activeSessionId) {
      try {
        await axios.post(`/api/chat/sessions/${activeSessionId}/messages`, {
          sender: 'system',
          text: `Updated workflow specification metadata.`,
          messageType: 'message',
          workflow: {
            spec: newSpec,
            isReadyToGenerate
          }
        });
      } catch (e) {
        console.warn('Failed to sync manual spec change to backend', e.message);
      }
    }
  };

  return (
    <div className="app-shell flex flex-col h-screen overflow-hidden">
      {/* Shared Header Navigation */}
      <Header
        activeTab="chat"
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Shared Sidebar */}
        <Sidebar activeTab="chat" />

        {/* Evolving Split-Screen Conversation Canvas */}
        <main className="flex-1 flex overflow-hidden">
          <WorkflowBuilder
            activeSessionId={activeSessionId}
            messages={messages}
            prompt={prompt}
            setPrompt={setPrompt}
            isLoading={isLoading}
            spec={spec}
            setSpec={handleSpecUpdate}
            isReadyToGenerate={isReadyToGenerate}
            handleSend={handleSend}
            handleAnswerClarify={handleAnswerClarify}
            handleSuggestion={handleSuggestion}
            handleDeployWorkflow={handleDeployWorkflow}
            showToast={showToast}
          />
        </main>
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

      {/* Toasts list */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
      </div>
    </div>
  );
}
