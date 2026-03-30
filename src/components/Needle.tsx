import React, { useRef, useEffect } from 'react'
import type { TuningStatus } from '../utils/noteUtils'

interface NeedleProps {
  position: number       // -1 (flat) to +1 (sharp)
  tuningStatus: TuningStatus
  isListening: boolean
  signalLevel: number
}

const TICK_COUNT = 11   // total ticks on the meter arc
const ARC_DEGREES = 120 // total sweep of the meter (±60° from center)

export const Needle: React.FC<NeedleProps> = ({
  position,
  tuningStatus,
  isListening,
  signalLevel,
}) => {
  const needleRef = useRef<SVGLineElement>(null)
  const currentAngleRef = useRef(0)
  const targetAngleRef  = useRef(0)
  const rafRef          = useRef(0)

  const targetAngle = isListening ? position * (ARC_DEGREES / 2) : 0

  // Smooth needle with spring-like interpolation for physical feel
  useEffect(() => {
    targetAngleRef.current = targetAngle

    const animate = () => {
      const diff = targetAngleRef.current - currentAngleRef.current
      currentAngleRef.current += diff * 0.18  // spring constant

      if (needleRef.current) {
        needleRef.current.setAttribute(
          'transform',
          `rotate(${currentAngleRef.current}, 150, 160)`,
        )
      }

      if (Math.abs(diff) > 0.01) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [targetAngle])

  // Color logic
  const getAccentColor = () => {
    if (!isListening || tuningStatus === 'idle') return '#ffffff20'
    if (tuningStatus === 'in-tune') return '#22c55e'
    if (tuningStatus === 'flat') return '#3b82f6'
    return '#ef4444'
  }

  const getGlowColor = () => {
    if (!isListening || tuningStatus === 'idle') return 'none'
    if (tuningStatus === 'in-tune') return 'rgba(34,197,94,0.6)'
    if (tuningStatus === 'flat') return 'rgba(59,130,246,0.6)'
    return 'rgba(239,68,68,0.6)'
  }

  const accentColor = getAccentColor()
  const glowColor   = getGlowColor()

  // Generate tick marks
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const t = i / (TICK_COUNT - 1)               // 0 to 1
    const angle = -ARC_DEGREES / 2 + t * ARC_DEGREES // -60° to +60°
    const angleRad = (angle * Math.PI) / 180

    const centerX = 150, centerY = 160
    const outerR = 128, innerR = i === Math.floor(TICK_COUNT / 2) ? 108 : 118

    const x1 = centerX + outerR * Math.sin(angleRad)
    const y1 = centerY - outerR * Math.cos(angleRad)
    const x2 = centerX + innerR * Math.sin(angleRad)
    const y2 = centerY - innerR * Math.cos(angleRad)

    const isCenter = i === Math.floor(TICK_COUNT / 2)
    const tickColor = isCenter
      ? '#22c55e'
      : i < Math.floor(TICK_COUNT / 2)
      ? '#3b82f6'
      : '#ef4444'

    return { x1, y1, x2, y2, angle, isCenter, tickColor }
  })

  // Arc path
  const centerX = 150, centerY = 160, arcR = 128
  const startAngle = -ARC_DEGREES / 2
  const endAngle   =  ARC_DEGREES / 2

  const arcPath = (startDeg: number, endDeg: number, r: number) => {
    const s = (startDeg * Math.PI) / 180
    const e = (endDeg   * Math.PI) / 180
    const x1 = centerX + r * Math.sin(s)
    const y1 = centerY - r * Math.cos(s)
    const x2 = centerX + r * Math.sin(e)
    const y2 = centerY - r * Math.cos(e)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg
        viewBox="0 0 300 180"
        className="w-full"
        style={{ maxWidth: 380, overflow: 'visible' }}
        aria-label="Tuning meter"
        role="img"
      >
        <defs>
          <filter id="needle-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="50%"  stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer arc track */}
        <path
          d={arcPath(startAngle, endAngle, arcR)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Colored arc (gradient) */}
        <path
          d={arcPath(startAngle, endAngle, arcR)}
          fill="none"
          stroke="url(#arcGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={isListening ? 0.8 : 0.2}
          style={{ transition: 'opacity 0.4s ease' }}
        />

        {/* Inner arc (scale ring) */}
        <path
          d={arcPath(startAngle, endAngle, 104)}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1"
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1} y1={tick.y1}
            x2={tick.x2} y2={tick.y2}
            stroke={tick.isCenter ? '#22c55e' : 'rgba(255,255,255,0.25)'}
            strokeWidth={tick.isCenter ? 2.5 : 1.2}
            strokeLinecap="round"
          />
        ))}

        {/* Flat / Sharp labels */}
        <text x="22" y="155" fill="#3b82f6" fontSize="11" fontFamily="Inter" fontWeight="600" opacity="0.8">♭</text>
        <text x="271" y="155" fill="#ef4444" fontSize="11" fontFamily="Inter" fontWeight="600" opacity="0.8">#</text>

        {/* Center dot glow (when in tune) */}
        {tuningStatus === 'in-tune' && isListening && (
          <circle cx={centerX} cy={centerY} r="30" fill="url(#centerGlow)" opacity="0.6" />
        )}

        {/* Needle shadow (glow) */}
        {isListening && tuningStatus !== 'idle' && (
          <line
            x1={centerX} y1={centerY}
            x2={centerX} y2={centerY - 100}
            stroke={glowColor}
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#glow-strong)"
            ref={undefined}
            transform={`rotate(${currentAngleRef.current}, ${centerX}, ${centerY})`}
            opacity={signalLevel * 0.7}
          />
        )}

        {/* Needle */}
        <line
          ref={needleRef}
          x1={centerX} y1={centerY + 12}
          x2={centerX} y2={centerY - 100}
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#needle-glow)"
          style={{ transition: 'stroke 0.3s ease' }}
        />

        {/* Needle pivot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="6"
          fill={accentColor}
          style={{ transition: 'fill 0.3s ease' }}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r="3"
          fill="rgba(0,0,0,0.6)"
        />
      </svg>

      {/* Flat / Sharp / In Tune scale labels */}
      <div className="flex w-full justify-between px-6 -mt-2" style={{ maxWidth: 380 }}>
        <span className="text-blue-400/60 text-xs font-semibold tracking-widest uppercase">Flat</span>
        <span className="text-green-400/60 text-xs font-semibold tracking-widest uppercase">In Tune</span>
        <span className="text-red-400/60 text-xs font-semibold tracking-widest uppercase">Sharp</span>
      </div>
    </div>
  )
}
