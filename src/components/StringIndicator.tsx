import React from 'react'
import type { TuningPreset, TuningNote } from '../utils/noteUtils'

interface StringIndicatorProps {
  preset: TuningPreset
  activeNote: string
  activeOctave: number
  isListening: boolean
}

export const StringIndicator: React.FC<StringIndicatorProps> = ({
  preset,
  activeNote,
  activeOctave,
  isListening,
}) => {
  const isActive = (s: TuningNote) =>
    isListening && s.note === activeNote && s.octave === activeOctave

  // Strings rendered as 6 circles (low to high, left to right)
  return (
    <div className="flex items-center justify-center gap-3" role="list" aria-label="Guitar strings">
      {preset.strings.map((string, i) => {
        const active = isActive(string)
        // String thickness suggestion: low E is thickest
        const thicknessClass = i === 0 ? 'w-10 h-10' : i === 1 ? 'w-9 h-9' : 'w-8 h-8'

        return (
          <div
            key={`${string.note}${string.octave}-${i}`}
            role="listitem"
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className={`
                ${thicknessClass} rounded-full flex items-center justify-center
                font-bold text-sm transition-all duration-300
                border
                ${active
                  ? 'bg-violet-500/30 border-violet-400/60 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/4 border-white/10 text-white/40'
                }
              `}
            >
              {string.note}
            </div>
            <span className="text-[9px] text-white/20 font-medium">{string.octave}</span>
          </div>
        )
      })}
    </div>
  )
}
