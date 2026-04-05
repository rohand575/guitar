import React from 'react'

interface FrequencyDisplayProps {
  frequency: number | null
  cents: number
  isListening: boolean
  centsHistory: number[]
}

export const FrequencyDisplay: React.FC<FrequencyDisplayProps> = ({
  frequency,
  cents,
  isListening,
  centsHistory,
}) => {
  const centsStr = cents === 0
    ? '±0'
    : cents > 0
    ? `+${cents}`
    : `${cents}`

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 w-full">
      <div className="flex items-center justify-center gap-6">
        {/* Frequency */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase">
            Frequency
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`font-bold font-mono-digits transition-all duration-200 ${
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
              className={`font-bold font-mono-digits transition-all duration-200 ${
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

      {/* Cents stability sparkline */}
      {isListening && centsHistory.length > 0 && (
        <div
          className="flex items-end justify-center gap-0.5"
          style={{ height: 18 }}
          aria-hidden="true"
          title="Cents stability over time"
        >
          {centsHistory.slice(-20).map((c, i) => {
            const inTune = Math.abs(c) <= 5
            const isFlat = c < -5
            const barColor = inTune
              ? 'bg-green-400/70'
              : isFlat
              ? 'bg-blue-400/50'
              : 'bg-red-400/50'

            // Height: taller = closer to in-tune (inverted deviation)
            const deviation = Math.min(Math.abs(c), 50)
            const heightPct = Math.max(0.15, 1 - deviation / 50)
            const heightPx = Math.round(heightPct * 14) + 4

            return (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-75 ${barColor}`}
                style={{ height: heightPx }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
