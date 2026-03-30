import React from 'react'

interface SignalMeterProps {
  level: number   // 0–1
  isListening: boolean
}

const BAR_COUNT = 12

export const SignalMeter: React.FC<SignalMeterProps> = ({ level, isListening }) => {
  const activeBars = Math.round(level * BAR_COUNT)

  return (
    <div className="flex items-end justify-center gap-0.5" aria-label="Signal level" style={{ height: 20 }}>
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const active = isListening && i < activeBars
        // Height ramp: short bars on the sides, tall in center — like a VU meter
        const heightPct = 30 + 70 * Math.sin((i / (BAR_COUNT - 1)) * Math.PI)
        // Color: green → yellow → red as level rises
        const colorClass =
          i < BAR_COUNT * 0.6
            ? active ? 'bg-green-400' : 'bg-white/8'
            : i < BAR_COUNT * 0.85
            ? active ? 'bg-yellow-400' : 'bg-white/8'
            : active ? 'bg-red-400' : 'bg-white/8'

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${colorClass}`}
            style={{ height: `${heightPct}%` }}
          />
        )
      })}
    </div>
  )
}
