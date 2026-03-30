import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { TUNING_PRESETS, type TuningPreset } from '../utils/noteUtils'

interface TuningSelectorProps {
  selected: TuningPreset
  onChange: (preset: TuningPreset) => void
  disabled?: boolean
}

export const TuningSelector: React.FC<TuningSelectorProps> = ({
  selected,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (preset: TuningPreset) => {
    onChange(preset)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          glass border border-white/10
          text-sm font-medium text-white/80
          transition-all duration-200
          ${disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:border-white/20 hover:text-white hover:bg-white/5 cursor-pointer'
          }
        `}
      >
        <span className="text-white/40 text-xs font-semibold tracking-widest uppercase mr-1">
          Tuning
        </span>
        {selected.name}
        <ChevronDown
          size={14}
          className={`text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute bottom-full mb-2 right-0
            glass-strong rounded-2xl
            shadow-2xl shadow-black/60
            overflow-hidden z-50
            animate-scale-in
          "
          role="listbox"
          style={{ minWidth: 180 }}
        >
          {TUNING_PRESETS.map(preset => {
            const isSelected = preset.name === selected.name
            return (
              <button
                key={preset.name}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(preset)}
                className={`
                  w-full flex items-center justify-between gap-4
                  px-4 py-3 text-sm font-medium
                  transition-colors duration-150 cursor-pointer
                  ${isSelected
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span>{preset.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-white/30 text-xs font-mono">
                    {preset.strings.map(s => s.note).join(' ')}
                  </span>
                  {isSelected && (
                    <Check size={12} className="text-violet-400 flex-shrink-0" />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
