import React, { useRef } from 'react'
import { Check, Volume2 } from 'lucide-react'
import { midiToFrequency, playReferenceTone, type TuningPreset, type TuningNote } from '../utils/noteUtils'

interface StringIndicatorProps {
  preset: TuningPreset
  activeNote: string
  activeOctave: number
  isListening: boolean
  tunedStrings: Set<string>
  a4Frequency: number
}

export const StringIndicator: React.FC<StringIndicatorProps> = ({
  preset,
  activeNote,
  activeOctave,
  isListening,
  tunedStrings,
  a4Frequency,
}) => {
  const isActive = (s: TuningNote) =>
    isListening && s.note === activeNote && s.octave === activeOctave

  // Track which circles are currently animating the ring pulse
  const pulsingRef = useRef<Set<number>>(new Set())
  const [pulsingSet, setPulsingSet] = React.useState<Set<number>>(new Set())

  const handlePlayRef = (string: TuningNote, index: number) => {
    if (isListening) return
    const freq = midiToFrequency(string.midi, a4Frequency)
    playReferenceTone(freq, 1.5)

    // Briefly highlight the circle
    pulsingRef.current.add(index)
    setPulsingSet(new Set(pulsingRef.current))
    setTimeout(() => {
      pulsingRef.current.delete(index)
      setPulsingSet(new Set(pulsingRef.current))
    }, 1600)
  }

  const tunedCount = preset.strings.filter(s => tunedStrings.has(`${s.note}${s.octave}`)).length

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Progress counter */}
      {isListening && (
        <p
          className="text-white/30 text-[11px] font-medium tracking-wide"
          aria-live="polite"
          aria-label={`${tunedCount} of ${preset.strings.length} strings in tune`}
        >
          {tunedCount} / {preset.strings.length} strings in tune
        </p>
      )}

      <div
        className="flex items-center justify-center gap-2 sm:gap-3"
        role="list"
        aria-label="Guitar strings"
      >
        {preset.strings.map((string, i) => {
          const active = isActive(string)
          const tuned  = tunedStrings.has(`${string.note}${string.octave}`)
          const pulsing = pulsingSet.has(i)

          // String thickness: low E is thickest, mirrors real string gauge proportions
          const sizes = [
            'w-9 h-9 sm:w-11 sm:h-11',
            'w-8 h-8 sm:w-10 sm:h-10',
            'w-7 h-7 sm:w-9 sm:h-9',
            'w-7 h-7 sm:w-8 sm:h-8',
            'w-6 h-6 sm:w-7 sm:h-7',
            'w-6 h-6',
          ]
          const thicknessClass = sizes[i] ?? 'w-7 h-7'

          return (
            <div
              key={`${string.note}${string.octave}-${i}`}
              role="listitem"
              className="flex flex-col items-center gap-1.5"
            >
              <button
                onClick={() => handlePlayRef(string, i)}
                disabled={isListening}
                title={isListening ? undefined : `Play ${string.note}${string.octave} reference tone`}
                aria-label={`String ${i + 1}: ${string.note} octave ${string.octave}${tuned ? ', in tune' : ''}`}
                className={`
                  relative ${thicknessClass} rounded-full flex items-center justify-center
                  font-bold text-sm transition-all duration-300
                  border focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
                  ${active
                    ? 'bg-violet-500/30 border-violet-400/60 text-white shadow-lg shadow-violet-500/30'
                    : tuned
                    ? 'bg-green-500/20 border-green-400/50 text-green-300 animate-pulse-ring'
                    : pulsing
                    ? 'bg-violet-500/20 border-violet-400/40 text-white/70'
                    : 'bg-white/4 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                  }
                  ${isListening ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                {string.note}

                {/* Tuned checkmark overlay */}
                {tuned && !active && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </span>
                )}

                {/* Reference tone icon on hover (non-listening) */}
                {!isListening && !tuned && !active && (
                  <span
                    className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-150 bg-white/5"
                    aria-hidden="true"
                  >
                    <Volume2 size={12} className="text-white/50" />
                  </span>
                )}
              </button>

              <span className="text-[9px] text-white/20 font-medium">{string.octave}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
