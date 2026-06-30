import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-text-muted"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-md border border-border bg-bg-surface px-3 py-1 text-sm text-text-primary shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-subtle/40 focus-visible:border-border-accent disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-status-error focus-visible:ring-status-error/40',
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-status-error font-medium">{error}</p>}
        {hint && !error && <p className="text-[11px] text-text-muted">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
