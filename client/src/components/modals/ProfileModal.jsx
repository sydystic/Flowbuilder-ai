export default function ProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="notion-surface w-full max-w-sm p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-ink">User Account</h3>
          <button onClick={onClose} className="notion-nav-item flex h-8 w-8 items-center justify-center" type="button">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <img
            className="h-16 w-16 rounded-xl object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkWlDbCQnjRS8tZsr_5JP_S3UqPb3KjB55ThqKgI9G17LBBvW9bA7xHncGQe-s2UtATJPfqBbITMBH_j3WXc9GcY5GjdtxlCAarjAuzgi5Q0oZvzyhOYhlYkYIbrs526etpTdW1FAzOKUaM5d44N8P6Iaq2ipUorVOBi2uA8zJNhXIvYOHpM_Qcgkyiu_ctlJt_9okTfAkd0MJHs0zgnTEyI4CwIxggOCvjylNKySUHoSaBRDnFWQybPnXuz72ncNwbQ7zN6TwAIg7"
            alt="Profile avatar"
          />
          <div>
            <h4 className="font-semibold text-ink">Siddharth Kurne</h4>
            <p className="text-sm text-ink-muted">siddharth@example.com</p>
            <span className="notion-chip mt-2 inline-flex">Developer Pro Plan</span>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <UsageRow label="Workflows Deployed" value="4 / 25" width="16%" />
          <UsageRow label="API Execution Quota" value="1,420 / 10,000" width="14.2%" />
        </div>

        <button onClick={onClose} className="notion-button-secondary mt-6 w-full" type="button">
          Close
        </button>
      </div>
    </div>
  );
}

function UsageRow({ label, value, width }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="font-medium text-ink">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
        <div className="h-full rounded-full bg-primary" style={{ width }} />
      </div>
    </div>
  );
}
