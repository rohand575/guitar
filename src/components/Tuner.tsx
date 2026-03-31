import React from 'react'
import { AlertCircle, Guitar, Radio, Music2 } from 'lucide-react'
import { useTuner } from '../hooks/useTuner'
import { Needle } from './Needle'
import { NoteDisplay } from './NoteDisplay'
import { FrequencyDisplay } from './FrequencyDisplay'
import { TuningSelector } from './TuningSelector'
import { StartButton } from './StartButton'
import { StringIndicator } from './StringIndicator'
import { SignalMeter } from './SignalMeter'
import { CalibrationControl } from './CalibrationControl'
import { Onboarding } from './Onboarding'

const LS_ONBOARDING = 'guitar_tuner_onboarded'

function hasSeenOnboarding(): boolean {
  try { return localStorage.getItem(LS_ONBOARDING) === 'true' } catch { return false }
}

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
    centsHistory,
    tunedStrings,
    tuneInCount,
    a4Frequency,
    isChromaticMode,
    start,
    stop,
    selectedPreset,
    setPreset,
    setA4Frequency,
    setChromaticMode,
  } = useTuner()

  const [isLoading, setIsLoading] = React.useState(false)
  const [showOnboarding, setShowOnboarding] = React.useState(() => !hasSeenOnboarding())

  const handleStart = async () => {
    setIsLoading(true)
    await start()
    setIsLoading(false)
  }

  const handleDismissOnboarding = () => {
    setShowOnboarding(false)
    try { localStorage.setItem(LS_ONBOARDING, 'true') } catch { /* ignore */ }
    handleStart()
  }

  // Dynamic glow class on the main card
  const cardGlow =
    !isListening || tuningStatus === 'idle' ? ''
    : tuningStatus === 'in-tune' ? 'glow-green'
    : tuningStatus === 'flat'    ? 'glow-blue'
    : 'glow-red'

  return (
    <>
      {/* First-time onboarding overlay */}
      {showOnboarding && <Onboarding onDismiss={handleDismissOnboarding} />}

      <div className="min-h-screen flex flex-col items-center justify-between py-2 sm:py-4 px-4 relative overflow-hidden">
        {/* Background layers */}
        <div className="fixed inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]" />
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
        <header className="w-full max-w-3xl animate-fade-in">
          {/* Top row: logo + tuning selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6c63ff, #a855f7)' }}
              >
                <Guitar size={16} className="text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-white tracking-tight" style={{ fontSize: 18 }}>
                Guitar
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Chromatic mode toggle */}
              <button
                onClick={() => setChromaticMode(!isChromaticMode)}
                disabled={isListening}
                title={isChromaticMode ? 'Switch to Guitar mode' : 'Switch to Chromatic mode'}
                aria-label={isChromaticMode ? 'Chromatic mode active — switch to Guitar mode' : 'Guitar mode active — switch to Chromatic mode'}
                aria-pressed={isChromaticMode}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                  border text-xs font-medium
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
                  ${isChromaticMode
                    ? 'bg-violet-500/20 border-violet-400/40 text-violet-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                  }
                  ${isListening ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isChromaticMode
                  ? <Radio size={11} aria-hidden="true" />
                  : <Music2 size={11} aria-hidden="true" />
                }
                <span>{isChromaticMode ? 'Chromatic' : 'Guitar'}</span>
              </button>

              <TuningSelector
                selected={selectedPreset}
                onChange={setPreset}
                disabled={isListening || isChromaticMode}
              />
            </div>
          </div>

          {/* Second row: A4 calibration */}
          <div className="flex justify-end mt-2">
            <CalibrationControl
              a4Frequency={a4Frequency}
              onChange={setA4Frequency}
              disabled={isListening}
            />
          </div>
        </header>

        {/* ── Main card ──────────────────────────────────────────────────────── */}
        <main className="w-full max-w-3xl flex flex-col items-center gap-2 sm:gap-4 animate-scale-in">

          {/* Meter card */}
          <div
            className={`
              w-full glass rounded-3xl p-4 sm:p-5
              grid grid-cols-1 md:grid-cols-2 md:gap-6 items-center
              transition-all duration-500
              ${cardGlow}
            `}
          >
            {/* Left col: Needle meter */}
            <div className="flex flex-col items-center justify-center">
              <Needle
                position={needlePosition}
                tuningStatus={tuningStatus}
                isListening={isListening}
                signalLevel={signalLevel}
              />
            </div>

            {/* Right col: Note + Frequency + Signal (on mobile these stack below needle) */}
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 mt-2 md:mt-0">
              {/* Note display */}
              <NoteDisplay
                note={note}
                octave={octave}
                tuningStatus={tuningStatus}
                isListening={isListening}
                tuneInCount={tuneInCount}
              />

              {/* Frequency + cents + sparkline */}
              <FrequencyDisplay
                frequency={frequency}
                cents={cents}
                isListening={isListening}
                centsHistory={centsHistory}
              />

              {/* Divider */}
              <div className="w-full h-px bg-white/6" />

              {/* Signal meter */}
              <SignalMeter level={signalLevel} isListening={isListening} />
            </div>
          </div>

          {/* String indicator (hidden in chromatic mode) */}
          {!isChromaticMode && (
            <StringIndicator
              preset={selectedPreset}
              activeNote={note}
              activeOctave={octave}
              isListening={isListening}
              tunedStrings={tunedStrings}
              a4Frequency={a4Frequency}
            />
          )}

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
              <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="text-red-300 text-sm leading-relaxed">{error}</p>
            </div>
          )}
        </main>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <footer className="w-full max-w-3xl flex flex-col items-center gap-2 sm:gap-4 animate-fade-in">
          <StartButton
            isListening={isListening}
            isLoading={isLoading}
            onStart={handleStart}
            onStop={stop}
          />

          {/* Hint text */}
          <p className="text-white/20 text-xs text-center leading-relaxed">
            {isListening
              ? isChromaticMode
                ? 'Chromatic mode — detecting any note'
                : 'Play a string and the tuner will detect it automatically'
              : 'Tap to enable the microphone and start tuning'
            }
          </p>
        </footer>
      </div>
    </>
  )
}
