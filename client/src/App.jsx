import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatScreen from './screens/ChatScreen';
import DashboardScreen from './screens/DashboardScreen';
import WorkflowDetailScreen from './screens/WorkflowDetailScreen';
import CredentialsScreen from './screens/CredentialsScreen';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChatScreen />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/workflow/:id" element={<WorkflowDetailScreen />} />
        <Route path="/credentials" element={<CredentialsScreen />} />
      </Routes>
    </Router>
  );
}
