import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wider text-text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'flex h-10 w-full rounded-md border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-subtle/40 focus-visible:border-border-accent disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer pr-8',
              error && 'border-status-error focus-visible:ring-status-error/40',
              className
            )}
            {...props}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value} className="bg-bg-surface">
                {o.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-text-muted">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && <p className="text-[11px] text-status-error font-medium">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
