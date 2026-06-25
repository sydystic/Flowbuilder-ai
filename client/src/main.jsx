import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply theme on application load
const savedTheme = localStorage.getItem('flowbuilder_theme') || 'light';
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Initialize default notifications if empty
if (!localStorage.getItem('flowbuilder_notifications')) {
  localStorage.setItem('flowbuilder_notifications', JSON.stringify([
    { id: 1, type: 'success', title: 'Workflow generated & deployed', desc: 'Sent Slack Message when GitHub issue is urgent', time: '10 mins ago' },
    { id: 2, type: 'info', title: 'Credential connected', desc: 'Slack bot connection has been established successfully.', time: '2 hours ago' },
    { id: 3, type: 'warning', title: 'n8n Execution Limit Alert', desc: 'Your free n8n instance has reached 80% execution limits.', time: '1 day ago' },
    { id: 4, type: 'success', title: 'Automation triggered', desc: 'Daily Good Morning Slack Message triggered successfully.', time: '1 day ago' }
  ]));
}

// Global helper for firing notifications from any React component
window.addFlowBuilderNotification = (type, title, desc) => {
  const stored = localStorage.getItem('flowbuilder_notifications');
  const list = stored ? JSON.parse(stored) : [];
  const newNotif = {
    id: Date.now(),
    type,
    title,
    desc,
    time: 'Just now'
  };
  list.unshift(newNotif);
  localStorage.setItem('flowbuilder_notifications', JSON.stringify(list));
  window.dispatchEvent(new Event('flowbuilder_notifications_updated'));
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
