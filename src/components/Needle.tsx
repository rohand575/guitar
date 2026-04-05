import React, { useRef, useEffect } from 'react'
import type { TuningStatus } from '../utils/noteUtils'

interface NeedleProps {
  position: number       // -1 (flat) to +1 (sharp)
  tuningStatus: TuningStatus
  isListening: boolean
  signalLevel: number
}

// Meter geometry constants
const CX = 150           // pivot X
const CY = 170           // pivot Y (below centre so arc sits above)
const ARC_HALF = 55      // ±55° sweep from vertical
const NEEDLE_LEN = 118   // tip distance from pivot
const NEEDLE_TAIL = 16   // tail length behind pivot
const OUTER_R = 130      // outer arc radius
const INNER_R = 106      // inner arc radius (scale ring)
const TICK_R_OUT = 128   // tick outer endpoint radius
const TICK_COUNT = 21    // total ticks (must be odd)

// Spring physics constants
const SPRING_K    = 160  // stiffness
const SPRING_DAMP = 18   // damping
const SPRING_MASS = 1    // mass
const DT          = 1 / 60 // ~60 fps timestep

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180
  const x1 = cx + r * Math.sin(toRad(startDeg))
  const y1 = cy - r * Math.cos(toRad(startDeg))
  const x2 = cx + r * Math.sin(toRad(endDeg))
  const y2 = cy - r * Math.cos(toRad(endDeg))
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

function arcBand(
  cx: number, cy: number,
  r1: number, r2: number,
  startDeg: number, endDeg: number,
): string {
  const toRad = (d: number) => (d * Math.PI) / 180
  const x1o = cx + r2 * Math.sin(toRad(startDeg))
  const y1o = cy - r2 * Math.cos(toRad(startDeg))
  const x2o = cx + r2 * Math.sin(toRad(endDeg))
  const y2o = cy - r2 * Math.cos(toRad(endDeg))
  const x1i = cx + r1 * Math.sin(toRad(endDeg))
  const y1i = cy - r1 * Math.cos(toRad(endDeg))
  const x2i = cx + r1 * Math.sin(toRad(startDeg))
  const y2i = cy - r1 * Math.cos(toRad(startDeg))
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return [
    `M ${x1o} ${y1o}`,
    `A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o}`,
    `L ${x1i} ${y1i}`,
    `A ${r1} ${r1} 0 ${large} 0 ${x2i} ${y2i}`,
    'Z',
  ].join(' ')
}

export const Needle: React.FC<NeedleProps> = ({
  position,
  tuningStatus,
  isListening,
  signalLevel,
}) => {
  // DOM refs — animated directly, zero React re-renders in the loop
  const needleLineRef  = useRef<SVGPolygonElement>(null)
  const needleGlowRef  = useRef<SVGPolygonElement>(null)
  const pivotOuterRef  = useRef<SVGCircleElement>(null)
  const pivotInnerRef  = useRef<SVGCircleElement>(null)
  const activeBandRef  = useRef<SVGPathElement>(null)
  const colorCacheRef  = useRef('')

  // Spring state
  const angleRef    = useRef(0)   // current angle (degrees)
  const velocityRef = useRef(0)   // angular velocity (deg/s)
  const targetRef   = useRef(0)   // target angle (degrees)
  const rafRef      = useRef(0)

  // Update target whenever props change
  const targetAngle = isListening ? position * ARC_HALF : 0
  targetRef.current = targetAngle

  useEffect(() => {
    const getColor = (status: TuningStatus, listening: boolean): string => {
      if (!listening || status === 'idle') return 'rgba(255,255,255,0.15)'
      if (status === 'in-tune') return '#22c55e'
      if (status === 'flat')    return '#3b82f6'
      return '#ef4444'
    }

    const getGlow = (status: TuningStatus, listening: boolean): string => {
      if (!listening || status === 'idle') return 'rgba(255,255,255,0.05)'
      if (status === 'in-tune') return 'rgba(34,197,94,0.55)'
      if (status === 'flat')    return 'rgba(59,130,246,0.55)'
      return 'rgba(239,68,68,0.55)'
    }

    const loop = () => {
      // ── Spring physics ─────────────────────────────────────────────────
      const diff     = targetRef.current - angleRef.current
      const force    = SPRING_K * diff - SPRING_DAMP * velocityRef.current
      velocityRef.current += (force / SPRING_MASS) * DT
      angleRef.current    += velocityRef.current * DT

      const angle = angleRef.current

      // ── Rotate needle and glow ─────────────────────────────────────────
      const transform = `rotate(${angle}, ${CX}, ${CY})`
      needleLineRef.current?.setAttribute('transform', transform)
      needleGlowRef.current?.setAttribute('transform', transform)

      // ── Pivot color ────────────────────────────────────────────────────
      const color = getColor(tuningStatus, isListening)
      if (color !== colorCacheRef.current) {
        colorCacheRef.current = color
        pivotOuterRef.current?.setAttribute('fill', color)
        needleLineRef.current?.setAttribute('fill', color)
        needleGlowRef.current?.setAttribute('fill', getGlow(tuningStatus, isListening))
      }

      // ── Active deviation arc ───────────────────────────────────────────
      if (activeBandRef.current) {
        const from = 0
        const to   = angle            // arc from centre to current needle
        const minA = Math.min(from, to)
        const maxA = Math.max(from, to)
        if (Math.abs(angle) > 0.5 && isListening && tuningStatus !== 'idle') {
          activeBandRef.current.setAttribute(
            'd',
            arcBand(CX, CY, INNER_R + 4, OUTER_R - 2, minA, maxA),
          )
          activeBandRef.current.setAttribute('opacity', String(Math.min(0.55, signalLevel * 0.7 + 0.2)))
          activeBandRef.current.setAttribute('fill', color)
        } else {
          activeBandRef.current.setAttribute('d', '')
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  // Re-run only when tuning status or listening state changes (color logic)
  // Position updates go through targetRef without re-running the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuningStatus, isListening])

  // ── Static geometry (computed once) ──────────────────────────────────────
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const t          = i / (TICK_COUNT - 1)                     // 0→1
    const angleDeg   = -ARC_HALF + t * ARC_HALF * 2             // -55°→+55°
    const angleRad   = (angleDeg * Math.PI) / 180
    const isCenter   = i === Math.floor(TICK_COUNT / 2)
    const isQuarter  = i % Math.floor(TICK_COUNT / 4) === 0 && !isCenter
    const tickLen    = isCenter ? 22 : isQuarter ? 16 : 10
    const outerR     = TICK_R_OUT
    const innerR     = outerR - tickLen
    return {
      x1: CX + outerR * Math.sin(angleRad),
      y1: CY - outerR * Math.cos(angleRad),
      x2: CX + innerR * Math.sin(angleRad),
      y2: CY - innerR * Math.cos(angleRad),
      isCenter,
      isQuarter,
    }
  })

  return (
    <div className="relative flex flex-col items-center select-none w-full">
      <svg
        viewBox="0 0 300 185"
        className="w-full"
        style={{ maxWidth: 400, overflow: 'visible' }}
        aria-label="Tuning meter needle"
        role="img"
      >
        <defs>
          {/* Needle glow filter */}
          <filter id="ng" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Strong glow */}
          <filter id="sg" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arc gradient: blue → green → red */}
          <linearGradient id="arcGrad" gradientUnits="userSpaceOnUse"
            x1={CX - OUTER_R} y1={CY} x2={CX + OUTER_R} y2={CY}>
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.7" />
            <stop offset="48%"  stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="52%"  stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.7" />
          </linearGradient>

          {/* Needle gradient (tip is brighter) */}
          <linearGradient id="needleGrad" gradientUnits="userSpaceOnUse"
            x1={CX} y1={CY + NEEDLE_TAIL} x2={CX} y2={CY - NEEDLE_LEN}>
            <stop offset="0%"   stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>

          {/* In-tune centre glow */}
          <radialGradient id="centreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Background arc band (full range, dim) ─────────────────── */}
        <path
          d={arcBand(CX, CY, INNER_R + 4, OUTER_R - 2, -ARC_HALF, ARC_HALF)}
          fill="rgba(255,255,255,0.025)"
        />

        {/* ── Centre in-tune zone (±5° band, always visible as target) ── */}
        <path
          d={arcBand(CX, CY, INNER_R + 4, OUTER_R - 2, -5, 5)}
          fill="rgba(34,197,94,0.12)"
        />

        {/* ── Outer arc track ────────────────────────────────────────── */}
        <path
          d={arcPath(CX, CY, OUTER_R, -ARC_HALF, ARC_HALF)}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={isListening ? 0.9 : 0.25}
          style={{ transition: 'opacity 0.4s ease' }}
        />

        {/* ── Inner arc ring ─────────────────────────────────────────── */}
        <path
          d={arcPath(CX, CY, INNER_R, -ARC_HALF, ARC_HALF)}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />

        {/* ── Active deviation band (updated by rAF) ─────────────────── */}
        <path ref={activeBandRef} d="" fill="white" opacity="0" />

        {/* ── Centre zone highlight (in-tune) ────────────────────────── */}
        {tuningStatus === 'in-tune' && isListening && (
          <circle cx={CX} cy={CY} r="36" fill="url(#centreGlow)" filter="url(#sg)" />
        )}

        {/* ── Tick marks ─────────────────────────────────────────────── */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1} y1={tick.y1}
            x2={tick.x2} y2={tick.y2}
            stroke={
              tick.isCenter
                ? '#22c55e'
                : tick.isQuarter
                ? 'rgba(255,255,255,0.4)'
                : 'rgba(255,255,255,0.18)'
            }
            strokeWidth={tick.isCenter ? 2.5 : tick.isQuarter ? 1.5 : 0.9}
            strokeLinecap="round"
          />
        ))}

        {/* ── Flat / Sharp symbol labels ──────────────────────────────── */}
        <text
          x={CX + (OUTER_R + 12) * Math.sin((-ARC_HALF * Math.PI) / 180)}
          y={CY - (OUTER_R + 12) * Math.cos((-ARC_HALF * Math.PI) / 180) + 4}
          fill="#3b82f6" fontSize="13" fontFamily="Inter" fontWeight="700"
          textAnchor="middle" opacity="0.7"
        >♭</text>
        <text
          x={CX + (OUTER_R + 12) * Math.sin((ARC_HALF * Math.PI) / 180)}
          y={CY - (OUTER_R + 12) * Math.cos((ARC_HALF * Math.PI) / 180) + 4}
          fill="#ef4444" fontSize="13" fontFamily="Inter" fontWeight="700"
          textAnchor="middle" opacity="0.7"
        >#</text>

        {/* ── Needle glow (wide blurred kite, same refs animate it) ──── */}
        <polygon
          ref={needleGlowRef}
          points={`${CX},${CY - NEEDLE_LEN} ${CX + 8},${CY + 4} ${CX},${CY + NEEDLE_TAIL} ${CX - 8},${CY + 4}`}
          fill="rgba(255,255,255,0.05)"
          filter="url(#sg)"
          opacity={isListening ? signalLevel * 0.8 : 0}
          style={{ transition: 'opacity 0.3s ease' }}
        />

        {/* ── Needle (kite polygon: pointed tip, wide at pivot, tail) ── */}
        <polygon
          ref={needleLineRef}
          points={`${CX},${CY - NEEDLE_LEN} ${CX + 2.8},${CY + 2} ${CX},${CY + NEEDLE_TAIL} ${CX - 2.8},${CY + 2}`}
          fill="rgba(255,255,255,0.15)"
          filter="url(#ng)"
        />

        {/* ── Pivot outer ring ───────────────────────────────────────── */}
        <circle
          ref={pivotOuterRef}
          cx={CX} cy={CY} r="8"
          fill="rgba(255,255,255,0.15)"
          style={{ transition: 'fill 0.35s ease' }}
        />
        {/* Pivot inner dot */}
        <circle
          ref={pivotInnerRef}
          cx={CX} cy={CY} r="4"
          fill="rgba(10,10,15,0.9)"
        />
        {/* Pivot centre dot */}
        <circle cx={CX} cy={CY} r="1.5" fill="rgba(255,255,255,0.6)" />
      </svg>

      {/* ── Scale labels ─────────────────────────────────────────────── */}
      <div className="flex w-full justify-between px-2 sm:px-4 -mt-2 sm:-mt-3" style={{ maxWidth: 400 }}>
        <span className="text-blue-400/50 text-[10px] font-semibold tracking-[0.18em] uppercase">Flat</span>
        <span className="text-green-400/50 text-[10px] font-semibold tracking-[0.18em] uppercase">In Tune</span>
        <span className="text-red-400/50 text-[10px] font-semibold tracking-[0.18em] uppercase">Sharp</span>
      </div>
    </div>
  )
}
