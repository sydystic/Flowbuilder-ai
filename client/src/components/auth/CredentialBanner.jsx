/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
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

  const missing = requiredServices.filter(s => status[s] === false);

  if (missing.length === 0) return null;

  return (
    <section className="rounded-xl bg-white/52 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="material-symbols-outlined text-[18px] text-[#93000a]">lock</span>
        Authentication required
      </div>

      <p className="mt-2 text-sm leading-5 text-ink-muted">
        Connect these services before deploying the workflow.
      </p>

      <ul className="mt-3 space-y-1.5">
        {missing.map((s, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-[#93000a]" />
            {s} API
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <Link to="/credentials" className="notion-button">
          Configure
        </Link>
        <button
          type="button"
          onClick={() => {
            checkStatus();
            if (showToast) showToast('Credentials status updated.');
          }}
          disabled={checking}
          className="notion-button-secondary"
        >
          {checking ? 'Checking...' : 'Check'}
        </button>
      </div>
    </section>
  );
}
