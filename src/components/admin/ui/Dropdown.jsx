import { useEffect, useRef, useState } from 'react'

// Generic click-to-toggle dropdown: renders `trigger` and, when open, `panel`
// positioned below it. Closes on outside click or Escape. Used for the
// Categories/Filter checkbox menus, per-row "..." action menus, and the
// custom select listbox (AdminSelect).
// `matchTriggerWidth` pins both edges (left-0 right-0) instead of shrink-
// to-fit, so a `w-full` panel child stretches to exactly the trigger's width
// — used by AdminSelect so its popup reads as one control with the trigger.
export default function Dropdown({ trigger, panel, align = 'left', matchTriggerWidth = false, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      {trigger(() => setOpen((v) => !v), open)}
      {open && (
        <div
          className={`adm-panel-in absolute z-20 mt-2 ${
            matchTriggerWidth ? 'left-0 right-0' : align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          }`}
        >
          {panel(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
