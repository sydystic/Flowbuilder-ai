import { useState, useEffect } from 'react';

function EditableField({ label, value, onSave, validate }) {
  const [isEditing, setIsEditing] = useState(false);
  
  const getStringValue = (val) => {
    if (!val) return '';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch (e) {
        return String(val);
      }
    }
    return String(val);
  };

  const [tempValue, setTempValue] = useState(getStringValue(value));
  const [error, setError] = useState(null);

  useEffect(() => {
    setTempValue(getStringValue(value));
  }, [value]);

  const handleBlur = () => {
    const validationError = validate ? validate(tempValue) : null;
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsEditing(false);
    onSave(tempValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setTempValue(getStringValue(value));
      setError(null);
      setIsEditing(false);
    }
  };

  const displayVal = value && value !== '[unknown]' ? getStringValue(value) : '';

  if (isEditing) {
    return (
      <div className="py-2">
        <div className="mb-1 text-xs font-medium text-ink-faint">{label}</div>
        <input
          type="text"
          value={tempValue}
          autoFocus
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="notion-input"
        />
        {error && <span className="mt-1 block text-sm text-[#93000a]">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex w-full items-start justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/[0.04]"
      type="button"
    >
      <span className="w-24 shrink-0 text-sm text-ink-muted">{label}</span>
      <span className={`min-w-0 flex-1 truncate text-sm ${displayVal ? 'text-ink' : 'italic text-ink-faint'}`}>
        {displayVal || 'Click to configure'}
      </span>
      <span className="material-symbols-outlined text-[16px] text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
        edit
      </span>
    </button>
  );
}

function SpecSection({ icon, title, children }) {
  return (
    <section className="rounded-xl bg-white/52 p-3">
      <div className="mb-2 flex items-center gap-2 px-2 text-sm font-semibold text-ink">
        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

export default function WorkflowSpecPanel({ spec, onSpecUpdate }) {
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
    <div className="space-y-4">
      <SpecSection icon="play_circle" title="Trigger">
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
      </SpecSection>

      <SpecSection icon="rocket_launch" title="Action">
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
      </SpecSection>

      {missingFields.length > 0 && (
        <section className="rounded-xl bg-white/52 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="material-symbols-outlined text-[18px] text-[#93000a]">warning</span>
            Missing info
            <span className="text-ink-faint">({missingFields.length})</span>
          </div>
          <ul className="space-y-2">
            {missingFields.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#93000a]" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
