import { useEffect, useRef } from 'react';

/**
 * Replaces the browser's confirm() for destructive admin actions. Same
 * hairline-ruled card language as the rest of the panel; the destructive
 * button is ruled in accent, never filled. Escape or the scrim cancels.
 */
export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={body ? 'confirm-body' : undefined}
        className="w-full max-w-sm border border-rule bg-surface p-5 shadow-[0_12px_40px_rgba(48,46,44,0.18)]"
      >
        <p className="eyebrow mb-2 text-[0.68rem]">Please confirm</p>
        <h2 id="confirm-title" className="font-display text-xl font-medium leading-snug text-ink">
          {title}
        </h2>
        {body && (
          <p id="confirm-body" className="mt-2 font-body text-sm text-ink">
            {body}
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-[40px] border border-rule bg-surface px-4 py-2 font-body text-sm text-ink transition-colors hover:border-ink disabled:opacity-50"
          >
            Keep it
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="min-h-[40px] border border-accent px-4 py-2 font-body text-sm text-accent transition-colors hover:bg-accent hover:text-surface disabled:opacity-50"
          >
            {busy ? 'One moment…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
