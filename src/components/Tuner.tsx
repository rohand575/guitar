import React from 'react'
import { AlertCircle, Guitar } from 'lucide-react'
import { useTuner } from '../hooks/useTuner'
import { Needle } from './Needle'
import { NoteDisplay } from './NoteDisplay'
import { FrequencyDisplay } from './FrequencyDisplay'
import { TuningSelector } from './TuningSelector'
import { StartButton } from './StartButton'
import { StringIndicator } from './StringIndicator'
import { SignalMeter } from './SignalMeter'

export const Tuner: React.FC = () => {
  const {
    isListening,
    frequency,
    note,
    octave,
    cents,
    needlePosition,
    tuningStatus,
    error,
    signalLevel,
    start,
    stop,
    selectedPreset,
    setPreset,
  } = useTuner()

  const [isLoading, setIsLoading] = React.useState(false)

  const handleStart = async () => {
    setIsLoading(true)
    await start()
    setIsLoading(false)
  }

  // Dynamic glow class on the main card
  const cardGlow =
    !isListening || tuningStatus === 'idle' ? ''
    : tuningStatus === 'in-tune' ? 'glow-green'
    : tuningStatus === 'flat'    ? 'glow-blue'
    : 'glow-red'

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-6 px-4 relative overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]" />

        {/* Ambient orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, #6c63ff 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-8 blur-3xl pointer-events-none animate-breathe"
          style={{
            bottom: '5%',
            right: '-10%',
            background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-6 blur-3xl pointer-events-none animate-breathe"
          style={{
            bottom: '10%',
            left: '-5%',
            animationDelay: '1.5s',
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="w-full max-w-md flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a855f7)' }}
          >
            <Guitar size={16} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-tight" style={{ fontSize: 18 }}>
            Guitar
          </span>
        </div>

        <TuningSelector
          selected={selectedPreset}
          onChange={setPreset}
          disabled={isListening}
        />
      </header>

      {/* ── Main card ──────────────────────────────────────────────────────── */}
      <main className="w-full max-w-md flex flex-col items-center gap-6 animate-scale-in">

        {/* Meter card */}
        <div
          className={`
            w-full glass rounded-3xl p-6 pb-5 flex flex-col items-center gap-5
            transition-all duration-500
            ${cardGlow}
          `}
        >
          {/* Needle meter */}
          <Needle
            position={needlePosition}
            tuningStatus={tuningStatus}
            isListening={isListening}
            signalLevel={signalLevel}
          />

          {/* Note display */}
          <NoteDisplay
            note={note}
            octave={octave}
            tuningStatus={tuningStatus}
            isListening={isListening}
          />

          {/* Frequency + cents */}
          <FrequencyDisplay
            frequency={frequency}
            cents={cents}
            isListening={isListening}
          />

          {/* Divider */}
          <div className="w-full h-px bg-white/6" />

          {/* Signal meter */}
          <SignalMeter level={signalLevel} isListening={isListening} />
        </div>

        {/* String indicator */}
        <StringIndicator
          preset={selectedPreset}
          activeNote={note}
          activeOctave={octave}
          isListening={isListening}
        />

        {/* Error message */}
        {error && (
          <div
            className="
              w-full flex items-start gap-3 px-4 py-3 rounded-2xl
              bg-red-500/10 border border-red-500/20
              animate-fade-in
            "
            role="alert"
          >
            <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm leading-relaxed">{error}</p>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="w-full max-w-md flex flex-col items-center gap-4 animate-fade-in">
        <StartButton
          isListening={isListening}
          isLoading={isLoading}
          onStart={handleStart}
          onStop={stop}
        />

        {/* Hint text */}
        <p className="text-white/20 text-xs text-center leading-relaxed">
          {isListening
            ? 'Play a string and the tuner will detect it automatically'
            : 'Tap to enable the microphone and start tuning'
          }
        </p>
      </footer>
    </div>
  )
}
