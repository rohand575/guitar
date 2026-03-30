import React from 'react'

interface FrequencyDisplayProps {
  frequency: number | null
  cents: number
  isListening: boolean
}

export const FrequencyDisplay: React.FC<FrequencyDisplayProps> = ({
  frequency,
  cents,
  isListening,
}) => {
  const centsStr = cents === 0
    ? '±0'
    : cents > 0
    ? `+${cents}`
    : `${cents}`

  return (
    <div className="flex items-center justify-center gap-6">
      {/* Frequency */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase">
          Frequency
        </span>
        <div className="flex items-baseline gap-1">
          <span
            className={`font-bold tabular-nums transition-all duration-200 ${
              isListening && frequency ? 'text-white' : 'text-white/20'
            }`}
            style={{ fontSize: 'clamp(22px, 5vw, 32px)' }}
          >
            {isListening && frequency !== null ? frequency.toFixed(1) : '---'}
          </span>
          <span className="text-white/30 text-sm font-medium">Hz</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-10 w-px bg-white/10" />

      {/* Cents offset */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase">
          Cents
        </span>
        <div className="flex items-baseline gap-0.5">
          <span
            className={`font-bold tabular-nums transition-all duration-200 ${
              isListening && frequency
                ? Math.abs(cents) <= 5
                  ? 'text-green-400'
                  : cents < 0
                  ? 'text-blue-400'
                  : 'text-red-400'
                : 'text-white/20'
            }`}
            style={{ fontSize: 'clamp(22px, 5vw, 32px)' }}
          >
            {isListening && frequency !== null ? centsStr : '---'}
          </span>
          <span className="text-white/30 text-sm font-medium">¢</span>
        </div>
      </div>
    </div>
  )
}
