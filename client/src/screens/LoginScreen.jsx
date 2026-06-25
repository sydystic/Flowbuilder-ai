import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Logged in successfully!');
      navigate('/');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      showToast(err.message || 'Google login failed.', 'error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f5f4] px-4 text-[#000000]">
      <div className="w-full max-w-[400px] rounded-xl bg-white p-8 border border-[#e6e6e6] shadow-sm">
        
        {/* Logo/Header */}
        <div className="flex flex-col items-center text-center">
          <img src="/favicon.svg" alt="FlowBuilder AI Logo" className="h-10 w-10 rounded-md" />
          <h1 className="mt-4 text-[26px] font-bold tracking-tight text-ink">
            Log in to FlowBuilder
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Enter your details below to access your account.
          </p>
        </div>

        {/* OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="notion-button-secondary mt-6 flex w-full items-center justify-center gap-2 py-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.11 2.76-2.36 3.62v3h3.84c2.25-2.07 3.55-5.11 3.55-8.71z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-3c-1.07.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.32v3.1C3.3 22.18 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.24 14.24c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3V6.54H1.32c-.8 1.6-1.25 3.39-1.25 5.3s.46 3.7 1.25 5.3l3.92-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.37 0 3.3 1.82 1.32 4.88l3.92 3.1c.95-2.88 3.61-5.23 6.76-5.23z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#e6e6e6]"></div>
          </div>
          <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-ink-faint">
            or
          </span>
        </div>

        {/* Email form */}
        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-muted">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="notion-input mt-1 w-full"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="notion-button mt-2 w-full justify-center py-2"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {/* Sign up prompt */}
        <p className="mt-6 text-center text-xs text-ink-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Sign up
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
