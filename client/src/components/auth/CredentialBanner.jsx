import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function CredentialBanner({ triggerService, actionService, showToast }) {
  const [status, setStatus] = useState({});
  const [checking, setChecking] = useState(false);

  const getRequiredServices = () => {
    const services = [];
    if (triggerService && triggerService !== '[unknown]') services.push(triggerService);
    if (actionService && actionService !== '[unknown]') services.push(actionService);
    return services;
  };

  const requiredServices = getRequiredServices();

  const checkStatus = async () => {
    if (requiredServices.length === 0) return;
    setChecking(true);
    try {
      const servicesParam = requiredServices.join(',');
      const res = await axios.get(`/api/credentials/status?services=${encodeURIComponent(servicesParam)}`);
      setStatus(res.data || {});
    } catch (e) {
      console.warn('Failed to fetch credentials status', e.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [triggerService, actionService]);

  if (requiredServices.length === 0) return null;

  // Compile missing items
  const missing = requiredServices.filter(s => status[s] === false);

  if (missing.length === 0) return null;

  return (
    <div className="glass-card p-4 rounded-xl border border-error/30 bg-error/5 flex flex-col gap-2 animate-fade-in">
      <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-wider">
        <span className="material-symbols-outlined text-[16px]">lock</span>
        Authentication Required
      </div>
      
      <p className="text-[11px] text-on-surface-variant leading-relaxed">
        🔐 To build and run this workflow, you need to connect:
      </p>

      <ul className="space-y-1">
        {missing.map((s, idx) => (
          <li key={idx} className="text-[11px] text-on-surface font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-error text-[12px]">cancel</span>
            {s} API (not connected)
          </li>
        ))}
      </ul>

      <div className="flex gap-2.5 mt-2.5">
        <Link
          to="/credentials"
          className="text-[10px] font-bold bg-error text-white px-3.5 py-1.5 rounded hover:bg-error/95 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[12px] font-bold">settings</span>
          Configure Now
        </Link>
        <button
          type="button"
          onClick={() => {
            checkStatus();
            if (showToast) showToast('Credentials status updated.');
          }}
          disabled={checking}
          className="text-[10px] font-bold bg-white/5 border border-white/10 text-on-surface px-3 py-1.5 rounded hover:bg-white/10 transition-all cursor-pointer"
        >
          {checking ? 'Checking...' : 'Check Status'}
        </button>
      </div>
    </div>
  );
}
