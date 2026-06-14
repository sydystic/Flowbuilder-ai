import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import ChatScreen from './screens/ChatScreen';
import DashboardScreen from './screens/DashboardScreen';
import WorkflowDetailScreen from './screens/WorkflowDetailScreen';
import CredentialsScreen from './screens/CredentialsScreen';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Configure Axios request interceptor for Supabase Auth JWT injection (development only)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supabase_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<ChatScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/workflow/:id" element={<WorkflowDetailScreen />} />
          <Route path="/credentials" element={<CredentialsScreen />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

