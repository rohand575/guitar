import React, { useEffect, useRef } from 'react'
import { ChevronDown, Minus, ChevronUp } from 'lucide-react'
import type { TuningStatus } from '../utils/noteUtils'

interface NoteDisplayProps {
  note: string
  octave: number
  tuningStatus: TuningStatus
  isListening: boolean
  tuneInCount: number
}

const statusColors: Record<TuningStatus, string> = {
  'in-tune': 'text-green-400 text-glow-green',
  'flat':    'text-blue-400 text-glow-blue',
  'sharp':   'text-red-400 text-glow-red',
  'idle':    'text-white/30',
}

const statusLabels: Record<TuningStatus, string> = {
  'in-tune': 'In Tune',
  'flat':    'Flat',
  'sharp':   'Sharp',
  'idle':    '',
}

const statusBadgeColors: Record<TuningStatus, string> = {
  'in-tune': 'bg-green-500/20 text-green-400 border border-green-500/30',
  'flat':    'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'sharp':   'bg-red-500/20 text-red-400 border border-red-500/30',
  'idle':    'bg-white/5 text-white/20 border border-white/10',
}

// Shape indicator alongside the text label for color-blind accessibility
const statusIcon: Partial<Record<TuningStatus, React.ReactNode>> = {
  'flat':    <ChevronDown size={10} className="text-blue-400" aria-hidden="true" />,
  'sharp':   <ChevronUp   size={10} className="text-red-400"  aria-hidden="true" />,
  'in-tune': <Minus       size={10} className="text-green-400" aria-hidden="true" />,
}

export const NoteDisplay: React.FC<NoteDisplayProps> = ({
  note,
  octave,
  tuningStatus,
  isListening,
  tuneInCount,
}) => {
  const noteColor = isListening ? statusColors[tuningStatus] : 'text-white/20'
  const isIdle    = !isListening || tuningStatus === 'idle'
  const label     = isListening ? statusLabels[tuningStatus] : ''

  // Burst animation: re-trigger each time we enter in-tune
  const noteRef     = useRef<HTMLSpanElement>(null)
  const prevCountRef = useRef(tuneInCount)

  useEffect(() => {
    if (tuneInCount > prevCountRef.current && noteRef.current) {
      const el = noteRef.current
      el.classList.remove('animate-burst')
      // Force reflow so the animation restarts
      void el.offsetWidth
      el.classList.add('animate-burst')

      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(80)
      }
    }
    prevCountRef.current = tuneInCount
  }, [tuneInCount])

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Note name */}
      <div className="relative flex items-start justify-center">
        <span
          ref={noteRef}
          className={`font-black tracking-tight transition-all duration-300 ${noteColor}`}
          style={{ fontSize: 'clamp(56px, 14vw, 120px)', lineHeight: 1 }}
          aria-label={isListening && note !== '-' ? `Note ${note} octave ${octave}` : undefined}
        >
          {note}
        </span>
        {/* Octave superscript */}
        {note !== '-' && isListening && (
          <span
            className="font-semibold text-white/40 mt-3 ml-1"
            style={{ fontSize: 'clamp(14px, 3vw, 24px)' }}
            aria-hidden="true"
          >
            {octave}
          </span>
        )}
      </div>

      {/* Tuning status badge with shape icon */}
      <div
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-300 ${
          isIdle ? statusBadgeColors['idle'] : statusBadgeColors[tuningStatus]
        }`}
        style={{ minWidth: 80, textAlign: 'center' }}
        role="status"
        aria-live="polite"
        aria-label={
          isIdle
            ? (isListening ? 'Listening' : 'Ready')
            : `${statusLabels[tuningStatus]}`
        }
      >
        {!isIdle && statusIcon[tuningStatus]}
        <span>{label || (isListening ? 'Listening…' : 'Ready')}</span>
      </div>
    </div>
  )
}
