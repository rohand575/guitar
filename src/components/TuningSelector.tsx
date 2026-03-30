import React, { useState, useRef, useEffect, useCallback } from 'react'
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
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const ref = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setFocusedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus the correct option when dropdown opens or focused index changes
  useEffect(() => {
    if (open && focusedIndex >= 0) {
      optionRefs.current[focusedIndex]?.focus()
    }
  }, [open, focusedIndex])

  const handleSelect = (preset: TuningPreset) => {
    onChange(preset)
    setOpen(false)
    setFocusedIndex(-1)
  }

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      const currentIdx = TUNING_PRESETS.findIndex(p => p.name === selected.name)
      setFocusedIndex(currentIdx >= 0 ? currentIdx : 0)
    }
  }, [disabled, selected.name])

  const handleOptionKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(Math.min(index + 1, TUNING_PRESETS.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(Math.max(index - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleSelect(TUNING_PRESETS[index])
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setFocusedIndex(-1)
        break
      case 'Tab':
        setOpen(false)
        setFocusedIndex(-1)
        break
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Tuning: ${selected.name}`}
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
          aria-hidden="true"
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
          aria-label="Tuning presets"
          style={{ minWidth: 180 }}
        >
          {TUNING_PRESETS.map((preset, index) => {
            const isSelected = preset.name === selected.name
            return (
              <button
                key={preset.name}
                ref={el => { optionRefs.current[index] = el }}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(preset)}
                onKeyDown={e => handleOptionKeyDown(e, index)}
                className={`
                  w-full flex items-center justify-between gap-4
                  px-4 py-3 text-sm font-medium
                  transition-colors duration-150 cursor-pointer
                  focus:outline-none focus-visible:bg-white/10
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
                    <Check size={12} className="text-violet-400 flex-shrink-0" aria-hidden="true" />
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
