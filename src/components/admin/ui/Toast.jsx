import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react'

const ToastContext = createContext(null)
let idSeq = 0

const TONE = {
  success: { icon: CheckCircle, bg: 'var(--adm-instock-bg)', border: 'var(--adm-instock-border)', fg: 'var(--adm-instock-text)' },
  error: { icon: WarningCircle, bg: 'var(--adm-outstock-bg)', border: 'var(--adm-outstock-border)', fg: 'var(--adm-danger)' },
  info: { icon: Info, bg: 'var(--adm-bg)', border: 'var(--adm-border)', fg: 'var(--adm-ink)' },
}

function ToastItem({ toast, onDismiss }) {
  const t = TONE[toast.type] || TONE.info
  const Icon = t.icon
  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-white p-3.5 shadow-[var(--adm-shadow-md)] ${
        toast.leaving ? 'adm-toast-out' : 'adm-toast-in'
      }`}
      style={{ borderColor: t.border }}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: t.bg, color: t.fg }}>
        <Icon size={18} weight="fill" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[14px] font-medium leading-snug text-[var(--adm-ink)]">{toast.text}</p>
        {toast.description && <p className="mt-0.5 text-[12px] text-[var(--adm-muted)]">{toast.description}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--adm-muted)] hover:bg-[var(--adm-bg)]"
        aria-label="Tutup notifikasi"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 150)
  }, [])

  const push = useCallback((type, text, opts = {}) => {
    const id = ++idSeq
    setToasts((list) => [...list, { id, type, text, description: opts.description }])
    const timer = setTimeout(() => dismiss(id), opts.duration ?? 3600)
    timers.current.set(id, timer)
    return id
  }, [dismiss])

  const api = useRef({
    success: (text, opts) => push('success', text, opts),
    error: (text, opts) => push('error', text, opts),
    info: (text, opts) => push('info', text, opts),
  }).current

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        // Re-declare .admin-theme here: portaled content is appended to
        // document.body, outside the DOM subtree that defines the --adm-*
        // custom properties, so nothing would inherit them without this.
        <div className="admin-theme pointer-events-none fixed bottom-4 right-4 z-[10000] flex w-full max-w-[360px] flex-col gap-2">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
