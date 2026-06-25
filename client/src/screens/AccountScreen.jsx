import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';

const AVATAR_PRESETS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBkWlDbCQnjRS8tZsr_5JP_S3UqPb3KjB55ThqKgI9G17LBBvW9bA7xHncGQe-s2UtATJPfqBbITMBH_j3WXc9GcY5GjdtxlCAarjAuzgi5Q0oZvzyhOYhlYkYIbrs526etpTdW1FAzOKUaM5d44N8P6Iaq2ipUorVOBi2uA8zJNhXIvYOHpM_Qcgkyiu_ctlJt_9okTfAkd0MJHs0zgnTEyI4CwIxggOCvjylNKySUHoSaBRDnFWQybPnXuz72ncNwbQ7zN6TwAIg7', // default
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
];

export default function AccountScreen() {
  const { user, profile, logout, updateProfile } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || AVATAR_PRESETS[0]);
    }
  }, [profile]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      showToast('Logged out successfully.');
    } catch (err) {
      console.error(err);
      showToast('Logout failed.', 'error');
      setIsLoggingOut(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await updateProfile(fullName, avatarUrl);
      showToast('Profile updated successfully!');
      // Dispatch event to update Header notifications unread count badge (and sync other assets)
      window.dispatchEvent(new Event('flowbuilder_notifications_updated'));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const email = user?.email || profile?.email || '';

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden text-[#000000]">
      <Header activeTab="account" />
      
      <div className="flex h-full flex-1 overflow-hidden">
        <Sidebar activeTab="account" />

        <main className="flex-1 overflow-y-auto px-8 py-8 bg-[#f6f5f4]">
          <div className="mx-auto max-w-2xl bg-white rounded-xl border border-[#e6e6e6] p-8 shadow-sm">
            <h1 className="text-[30px] font-semibold tracking-[-0.015em] text-ink">
              User Profile
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Manage your personal information and active session.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-8 space-y-6">
              {/* Profile Card / Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-[#e6e6e6] pb-6">
                <img
                  src={avatarUrl || AVATAR_PRESETS[0]}
                  alt={fullName || 'Avatar'}
                  className="h-20 w-20 rounded-2xl object-cover border border-[#e6e6e6] shadow-sm"
                />
                <div className="flex-1 space-y-2">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">Choose Avatar Preset</span>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`h-10 w-10 rounded-lg overflow-hidden border-2 transition-all ${
                          avatarUrl === preset ? 'border-primary scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt={`Preset ${index}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editable Name */}
              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="notion-input mt-1 w-full"
                />
              </div>

              {/* Read-only details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Email Address</span>
                  <p className="mt-1 text-sm font-medium text-ink bg-[#f6f5f4] px-3 py-2 rounded-md border border-[#e6e6e6] select-all">
                    {email}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">User ID (Supabase Auth)</span>
                  <p className="mt-1 text-xs font-mono text-ink bg-[#f6f5f4] px-3 py-2 rounded-md border border-[#e6e6e6] break-all select-all">
                    {user?.id || ''}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e6e6e6] flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="notion-button-secondary bg-[#93000a]/10 hover:bg-[#93000a]/20 text-[#93000a] flex items-center justify-center gap-1.5 h-10 px-4 font-semibold"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[19px]">logout</span>
                  {isLoggingOut ? 'Logging out...' : 'Log Out'}
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !fullName.trim()}
                  className="notion-button h-10 px-4"
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>

          </div>
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}
