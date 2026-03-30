import React from 'react'
import type { TuningStatus } from '../utils/noteUtils'

interface NoteDisplayProps {
  note: string
  octave: number
  tuningStatus: TuningStatus
  isListening: boolean
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

export const NoteDisplay: React.FC<NoteDisplayProps> = ({
  note,
  octave,
  tuningStatus,
  isListening,
}) => {
  const noteColor = isListening ? statusColors[tuningStatus] : 'text-white/20'
  const isIdle = !isListening || tuningStatus === 'idle'
  const label  = isListening ? statusLabels[tuningStatus] : ''

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Note name */}
      <div className="relative flex items-start justify-center">
        <span
          className={`font-black tracking-tight transition-all duration-300 ${noteColor}`}
          style={{ fontSize: 'clamp(80px, 18vw, 140px)', lineHeight: 1 }}
        >
          {note}
        </span>
        {/* Octave superscript */}
        {note !== '-' && isListening && (
          <span
            className="font-semibold text-white/40 mt-3 ml-1"
            style={{ fontSize: 'clamp(18px, 4vw, 28px)' }}
          >
            {octave}
          </span>
        )}
      </div>

      {/* Tuning status badge */}
      <div
        className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-300 ${
          isIdle ? statusBadgeColors['idle'] : statusBadgeColors[tuningStatus]
        }`}
        style={{ minWidth: 80, textAlign: 'center' }}
      >
        {label || (isListening ? 'Listening…' : 'Ready')}
      </div>
    </div>
  )
}
