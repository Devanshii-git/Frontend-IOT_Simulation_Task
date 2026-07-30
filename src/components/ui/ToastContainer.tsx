import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type Toast } from '@/store/toastStore'

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-status-online shrink-0" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-status-error shrink-0" />
      case 'info':
        return <Info className="h-5 w-5 text-accent shrink-0" />
    }
  }

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-status-online/10 border-status-online/30 text-status-online'
      case 'error':
        return 'bg-status-error/10 border-status-error/30 text-status-error font-medium'
      case 'info':
        return 'bg-accent/10 border-border-accent/30 text-accent'
    }
  }

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md ${getToastStyles(
              toast.type
            )}`}
          >
            {getIcon(toast.type)}
            <span className="text-xs font-bold leading-relaxed flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="hover:opacity-80 transition-opacity p-0.5 shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4 opacity-60 hover:opacity-100" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
