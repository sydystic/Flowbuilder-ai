import React, { useState } from 'react';

function EditableField({ label, value, onSave, validate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [error, setError] = useState(null);

  const handleBlur = () => {
    const validationError = validate ? validate(tempValue) : null;
    if (validationError) {
      setError(validationError);
    } else {
      setError(null);
      setIsEditing(false);
      onSave(tempValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setTempValue(value || '');
      setError(null);
      setIsEditing(false);
    }
  };

  const displayVal = value && value !== '[unknown]' ? value : '';

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 w-full animate-fade-in mt-1">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={tempValue}
            autoFocus
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-[#1a1a2e] border border-primary/50 rounded px-2 py-1 text-xs text-on-surface focus:outline-none"
          />
        </div>
        {error && <span className="text-[9px] text-error font-semibold">{error}</span>}
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="group flex justify-between items-center py-1.5 px-2 hover:bg-white/5 rounded transition-all cursor-pointer border border-transparent hover:border-white/5 mt-0.5"
    >
      <div className="text-[11px] text-on-surface-variant flex-1 min-w-0 pr-2">
        <span className="font-semibold text-outline-variant mr-1.5">{label}:</span>
        <span className={displayVal ? 'text-on-surface font-medium truncate inline-block max-w-[150px]' : 'text-outline-variant/40 italic'}>
          {displayVal || 'Click to configure'}
        </span>
      </div>
      <span className="material-symbols-outlined text-[12px] text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity">
        edit
      </span>
    </div>
  );
}

export default function WorkflowSpecPanel({ spec, onSpecUpdate }) {
  // Validate Slack channel starts with #
  const validateSlackChannel = (val) => {
    if (val && !val.startsWith('#') && !val.startsWith('@') && spec.action?.service?.toLowerCase().includes('slack')) {
      return 'Slack channel must start with # or @';
    }
    return null;
  };

  const handleUpdate = (section, field, newVal) => {
    const updated = {
      ...spec,
      [section]: {
        ...spec[section],
        [field]: newVal || '[unknown]'
      }
    };
    if (onSpecUpdate) onSpecUpdate(updated);
  };

  // Compile missing fields dynamically
  const getMissingFieldsList = () => {
    const list = [];
    if (!spec.trigger?.service || spec.trigger.service === '[unknown]') {
      list.push('Trigger service is not specified');
    }
    if (spec.trigger?.service?.toLowerCase().includes('sheet') && (!spec.trigger.sheetName || spec.trigger.sheetName === '[unknown]')) {
      list.push('Google Sheet name or URL is missing');
    }
    if (!spec.action?.service || spec.action.service === '[unknown]') {
      list.push('Action service is not specified');
    }
    if (spec.action?.service?.toLowerCase().includes('slack') && (!spec.action.channel || spec.action.channel === '[unknown]')) {
      list.push('Slack channel is missing');
    }
    if (!spec.action?.details || spec.action.details === '[unknown]') {
      list.push('Action message details or email content is missing');
    }
    return list;
  };

  const missingFields = getMissingFieldsList();

  return (
    <div className="flex flex-col gap-4">
      {/* TRIGGER CARD */}
      <div className="glass-card p-4 rounded-xl border border-white/10 bg-[#131320]/40 flex flex-col gap-1 animate-fade-in">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            Trigger Node
          </div>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">n8n Node</span>
        </div>

        <EditableField
          label="Service"
          value={spec.trigger?.service}
          onSave={(val) => handleUpdate('trigger', 'service', val)}
        />
        <EditableField
          label="Event"
          value={spec.trigger?.event}
          onSave={(val) => handleUpdate('trigger', 'event', val)}
        />
        {spec.trigger?.service?.toLowerCase().includes('sheet') && (
          <EditableField
            label="Sheet"
            value={spec.trigger?.sheetName}
            onSave={(val) => handleUpdate('trigger', 'sheetName', val)}
          />
        )}
        <EditableField
          label="Details"
          value={spec.trigger?.details}
          onSave={(val) => handleUpdate('trigger', 'details', val)}
        />
      </div>

      {/* ACTION CARD */}
      <div className="glass-card p-4 rounded-xl border border-white/10 bg-[#131320]/40 flex flex-col gap-1 animate-fade-in">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            Action Node
          </div>
          <span className="text-[10px] bg-purple-400/10 text-purple-400 px-2 py-0.5 rounded font-bold">n8n Node</span>
        </div>

        <EditableField
          label="Service"
          value={spec.action?.service}
          onSave={(val) => handleUpdate('action', 'service', val)}
        />
        <EditableField
          label="Action"
          value={spec.action?.action}
          onSave={(val) => handleUpdate('action', 'action', val)}
        />
        {spec.action?.service?.toLowerCase().includes('slack') && (
          <EditableField
            label="Channel"
            value={spec.action?.channel}
            onSave={(val) => handleUpdate('action', 'channel', val)}
            validate={validateSlackChannel}
          />
        )}
        <EditableField
          label="Details"
          value={spec.action?.details}
          onSave={(val) => handleUpdate('action', 'details', val)}
        />
      </div>

      {/* MISSING INFO SUMMARY */}
      {missingFields.length > 0 && (
        <div className="glass-card p-4 rounded-xl border border-amber-400/20 bg-amber-400/5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Missing Info ({missingFields.length})
          </div>
          <ul className="space-y-1">
            {missingFields.map((f, i) => (
              <li key={i} className="text-[11px] text-on-surface-variant flex items-start gap-1.5 leading-tight">
                <span className="text-amber-400 mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
