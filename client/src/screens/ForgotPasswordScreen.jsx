import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email || isLoading) return;
    
    setIsLoading(true);
    try {
      await resetPassword(email);
      showToast('Password reset link sent to your email!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error sending password reset link.', 'error');
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
            Reset password
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            We will email you a link to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleReset} className="mt-6 space-y-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="notion-button mt-2 w-full justify-center py-2"
          >
            {isLoading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>

        {/* Back to login */}
        <p className="mt-6 text-center text-xs text-ink-muted">
          Remember your password?{' '}
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
