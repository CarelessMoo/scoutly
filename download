import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { X } from 'lucide-react'

type Toast = { id: string; title: string; description?: string }
type ToastContextValue = { toast: (toast: Omit<Toast, 'id'>) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const value = useMemo(
    () => ({
      toast: (toast: Omit<Toast, 'id'>) => {
        const id = crypto.randomUUID()
        setToasts((current) => [...current, { id, ...toast }])
        window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3800)
      },
    }),
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-lg border border-white/10 bg-slate-950 p-4 text-white shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && <p className="mt-1 text-sm text-slate-400">{toast.description}</p>}
              </div>
              <button
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-white"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
