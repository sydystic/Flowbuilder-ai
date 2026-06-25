import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

export default function SignupScreen() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName || isLoading) return;
    
    setIsLoading(true);
    try {
      await signup(email, password, fullName);
      showToast('Account created successfully! Check your email for confirmation.', 'success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Signup failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f5f4] px-4 text-[#000000]">
      <div className="w-full max-w-[400px] rounded-xl bg-white p-8 border border-[#e6e6e6] shadow-sm">
        
        {/* Logo/Header */}
        <div className="flex flex-col items-center text-center">
          <img src="/favicon.svg" alt="FlowBuilder AI Logo" className="h-10 w-10 rounded-md" />
          <h1 className="mt-4 text-[26px] font-bold tracking-tight text-ink">
            Create account
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Start automating your workflows today.
          </p>
        </div>

        {/* Email form */}
        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-muted">Full Name</label>
            <input
              type="text"
              required
              placeholder="Siddhi Kurne"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="notion-input mt-1 w-full"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted">Email address</label>
            <input
              type="email"
              required
              placeholder="name@work.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="notion-input mt-1 w-full"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted">Password</label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="notion-input mt-1 w-full"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="notion-button mt-2 w-full justify-center py-2"
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        {/* Log in prompt */}
        <p className="mt-6 text-center text-xs text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>

      </div>

      {/* Toasts list */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}
