import { ArrowRight, CaretDown, Check } from '@phosphor-icons/react'
import Dropdown from './Dropdown'

// Figma-exact admin form controls (Button & Forms Components frame).
// Pill buttons/inputs, blue checkbox/switch, label + hint + focus/error states.

export function AdminButton({
  variant = 'primary',
  children,
  className = '',
  trailingIcon = false,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-[100px] px-5 py-3 text-[16px] font-medium transition-[colors,transform] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
  const variants = {
    primary: 'bg-[var(--adm-mint)] text-black hover:brightness-95',
    forest: 'bg-[var(--adm-forest-500)] text-white hover:opacity-90',
    secondary: 'bg-white text-black border border-[var(--adm-border)] hover:bg-[var(--adm-bg)]',
    ghost: 'bg-transparent text-black hover:bg-[var(--adm-bg)]',
    danger: 'bg-[var(--adm-danger-bg)] text-[var(--adm-danger)] hover:brightness-95',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
      {trailingIcon && <ArrowRight size={18} />}
    </button>
  )
}

export function Field({ label, hint, error, required, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-[14px] font-medium text-[var(--adm-text)]">
          {label}
          {required && <span className="text-[var(--adm-danger)]"> *</span>}
        </span>
      )}
      {children}
      {(hint || error) && (
        <span className={`text-[12px] ${error ? 'text-[var(--adm-danger)]' : 'text-[var(--adm-muted)]'}`}>
          {error || hint}
        </span>
      )}
    </label>
  )
}

const inputBase =
  'w-full rounded-[100px] border bg-white px-4 py-3 text-[15px] text-black placeholder:text-[var(--adm-muted)] focus:outline-none transition-colors'

export function AdminInput({ error, leftIcon, className = '', ...props }) {
  const border = error
    ? 'border-[var(--adm-danger)] bg-[var(--adm-danger-bg)]'
    : 'border-[var(--adm-border)] focus:border-[var(--adm-info)]'
  if (leftIcon) {
    return (
      <div className={`flex items-center gap-2 rounded-[100px] border bg-white px-4 ${error ? 'border-[var(--adm-danger)] bg-[var(--adm-danger-bg)]' : 'border-[var(--adm-border)] focus-within:border-[var(--adm-info)]'}`}>
        <span className="text-[var(--adm-muted)]">{leftIcon}</span>
        <input className="w-full bg-transparent py-3 text-[15px] text-black placeholder:text-[var(--adm-muted)] focus:outline-none" {...props} />
      </div>
    )
  }
  return <input className={`${inputBase} ${border} ${className}`} {...props} />
}

export function AdminTextarea({ error, className = '', ...props }) {
  const border = error
    ? 'border-[var(--adm-danger)] bg-[var(--adm-danger-bg)]'
    : 'border-[var(--adm-border)] focus:border-[var(--adm-info)]'
  return (
    <textarea
      className={`w-full rounded-[12px] border bg-white px-4 py-3 text-[15px] text-black placeholder:text-[var(--adm-muted)] focus:outline-none transition-colors ${border} ${className}`}
      {...props}
    />
  )
}

// Custom listbox — replaces the native <select>, whose OS-rendered options
// popup can't be styled to match the rest of the admin UI. Same trigger +
// adm-card popup pattern as every other dropdown (Kategori filter, row "...").
// `pill` picks the trigger shape: rounded-full (matches AdminInput, used in
// Staff forms) or rounded-xl/"boxy" (matches ProductFormPage's inputs).
export function AdminSelect({ value, onChange, options, placeholder = 'Pilih', error, pill = true, className = '' }) {
  const opts = options.map((o) => ({
    value: o?.value ?? o,
    label: o?.label ?? o,
  }))
  const selected = opts.find((o) => o.value === value)
  const border = error ? 'border-[var(--adm-danger)]' : 'border-[var(--adm-border)]'

  return (
    <Dropdown
      className={`w-full ${className}`}
      matchTriggerWidth
      trigger={(toggle, open) => (
        <button
          type="button"
          onClick={toggle}
          className={`flex w-full items-center justify-between gap-2 border bg-white text-left outline-none transition-colors ${
            pill ? 'rounded-[100px] px-4 py-3 text-[15px]' : 'rounded-xl px-4 py-2.5 text-[14px]'
          } ${open ? 'border-[var(--adm-forest-500)]' : border}`}
        >
          <span className={`truncate ${selected ? 'text-[var(--adm-ink)]' : 'text-[var(--adm-muted)]'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <CaretDown
            size={16}
            className={`shrink-0 text-[var(--adm-muted)] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      panel={(close) => (
        <div className="adm-card max-h-64 w-full overflow-y-auto p-1.5">
          {opts.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                close()
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[14px] hover:bg-[var(--adm-bg)] ${
                o.value === value ? 'font-medium text-[var(--adm-ink)]' : 'text-[var(--adm-text)]'
              }`}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && <Check size={16} weight="bold" className="shrink-0 text-[var(--adm-info)]" />}
            </button>
          ))}
        </div>
      )}
    />
  )
}

export function AdminSwitch({ checked, onChange, id }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-[var(--adm-info)]' : 'bg-[var(--adm-border-strong)]'
      }`}
    >
      <span
        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function AdminCheckbox({ checked, onChange, label, id }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        className={`flex size-5 items-center justify-center rounded-[6px] border transition-colors ${
          checked ? 'border-[var(--adm-info)] bg-[var(--adm-info)]' : 'border-[var(--adm-border-strong)] bg-white'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="size-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.5 3.5L13 4.5" />
          </svg>
        )}
      </button>
      {label && <span className="text-[15px] text-black">{label}</span>}
    </label>
  )
}

export function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[100px] border px-3.5 py-1.5 text-[14px] transition-colors ${
        selected
          ? 'border-[var(--adm-mint)] bg-[color-mix(in_srgb,var(--adm-mint)_18%,white)] text-black'
          : 'border-[var(--adm-border)] bg-white text-[var(--adm-text)] hover:bg-[var(--adm-bg)]'
      }`}
    >
      {selected && (
        <svg viewBox="0 0 16 16" className="size-3.5 text-[var(--adm-forest-500)]" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8.5l3.5 3.5L13 4.5" />
        </svg>
      )}
      {children}
    </button>
  )
}
