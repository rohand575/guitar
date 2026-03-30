import React from 'react'

interface CalibrationControlProps {
  a4Frequency: number
  onChange: (freq: number) => void
  disabled?: boolean
}

export const CalibrationControl: React.FC<CalibrationControlProps> = ({
  a4Frequency,
  onChange,
  disabled = false,
}) => {
  const step = (delta: number) => {
    onChange(a4Frequency + delta)
  }

  return (
    <div
      className={`flex items-center gap-1.5 transition-opacity duration-200 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      title="A4 reference frequency calibration"
    >
      <button
        onClick={() => step(-1)}
        aria-label="Decrease A4 frequency"
        className="
          w-6 h-6 rounded-lg flex items-center justify-center
          text-white/40 hover:text-white/80
          bg-white/5 hover:bg-white/10 border border-white/10
          transition-all duration-150 text-xs font-bold
          focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
        "
      >
        −
      </button>

      <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
        <span className="text-white/20 text-[9px] font-semibold tracking-widest uppercase leading-none mb-0.5">
          A4
        </span>
        <span className="text-white/60 text-xs font-bold tabular-nums">
          {a4Frequency} Hz
        </span>
      </div>

      <button
        onClick={() => step(+1)}
        aria-label="Increase A4 frequency"
        className="
          w-6 h-6 rounded-lg flex items-center justify-center
          text-white/40 hover:text-white/80
          bg-white/5 hover:bg-white/10 border border-white/10
          transition-all duration-150 text-xs font-bold
          focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
        "
      >
        +
      </button>
    </div>
  )
}
