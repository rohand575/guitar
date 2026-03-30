import { useState, useRef, useCallback, useEffect } from 'react'
import { detectPitch, createAnalyser } from '../utils/pitchDetection'
import {
  frequencyToNote,
  centsToNeedlePosition,
  getTuningStatus,
  TUNING_PRESETS,
  DEFAULT_A4_FREQ,
  type TuningStatus,
  type TuningPreset,
} from '../utils/noteUtils'

// ─── localStorage keys ───────────────────────────────────────────────────────
const LS_PRESET      = 'guitar_tuner_preset'
const LS_A4_FREQ     = 'guitar_tuner_a4'
const LS_CHROMATIC   = 'guitar_tuner_chromatic'

// How many frames of cents history to keep (~20 frames ≈ 0.33s at 60fps)
const CENTS_HISTORY_SIZE = 20
// How long (ms) a string must stay in-tune before it's marked as tuned
const IN_TUNE_HOLD_MS = 800

// Smoothing factor for frequency readings (0 = no smoothing, 1 = never updates)
const FREQ_SMOOTHING = 0.6
// How many consecutive similar readings to require before committing a note change
const NOTE_STABILITY_FRAMES = 3

export interface TunerState {
  isListening: boolean
  frequency: number | null
  note: string
  octave: number
  cents: number
  needlePosition: number    // -1 (full flat) to +1 (full sharp)
  tuningStatus: TuningStatus
  error: string | null
  signalLevel: number       // 0–1, for VU meter
  centsHistory: number[]    // rolling buffer of recent cents values
  tunedStrings: Set<string> // note+octave keys that have been held in-tune
  tuneInCount: number       // increments each time we transition into in-tune
  a4Frequency: number       // A4 reference Hz (default 440)
  isChromaticMode: boolean  // if true, detect any note (not just guitar strings)
}

export interface UseTunerReturn extends TunerState {
  start: () => Promise<void>
  stop: () => void
  selectedPreset: TuningPreset
  setPreset: (preset: TuningPreset) => void
  setA4Frequency: (freq: number) => void
  setChromaticMode: (chromatic: boolean) => void
  resetTunedStrings: () => void
}

function loadPreset(): TuningPreset {
  try {
    const saved = localStorage.getItem(LS_PRESET)
    if (saved) {
      const found = TUNING_PRESETS.find(p => p.name === saved)
      if (found) return found
    }
  } catch { /* ignore */ }
  return TUNING_PRESETS[0]
}

function loadA4Frequency(): number {
  try {
    const saved = localStorage.getItem(LS_A4_FREQ)
    if (saved) {
      const val = parseInt(saved, 10)
      if (val >= 430 && val <= 450) return val
    }
  } catch { /* ignore */ }
  return DEFAULT_A4_FREQ
}

function loadChromaticMode(): boolean {
  try {
    return localStorage.getItem(LS_CHROMATIC) === 'true'
  } catch { return false }
}

function makeInitialState(a4Frequency: number, isChromaticMode: boolean): TunerState {
  return {
    isListening: false,
    frequency: null,
    note: '-',
    octave: 0,
    cents: 0,
    needlePosition: 0,
    tuningStatus: 'idle',
    error: null,
    signalLevel: 0,
    centsHistory: [],
    tunedStrings: new Set(),
    tuneInCount: 0,
    a4Frequency,
    isChromaticMode,
  }
}

export function useTuner(): UseTunerReturn {
  const [state, setState] = useState<TunerState>(() =>
    makeInitialState(loadA4Frequency(), loadChromaticMode())
  )
  const [selectedPreset, setSelectedPreset] = useState<TuningPreset>(loadPreset)

  // Audio pipeline refs (not React state – no re-renders on audio updates)
  const audioContextRef  = useRef<AudioContext | null>(null)
  const analyserRef      = useRef<AnalyserNode | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const rafRef           = useRef<number>(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bufferRef        = useRef<any>(null)

  // Smoothed frequency (exponential moving average)
  const smoothedFreqRef  = useRef<number | null>(null)
  // Stability buffer for note changes
  const noteHistoryRef   = useRef<string[]>([])

  // New feature refs
  const a4FreqRef        = useRef<number>(loadA4Frequency())
  const chromaticRef     = useRef<boolean>(loadChromaticMode())
  const prevStatusRef    = useRef<TuningStatus>('idle')
  const inTuneStartRef   = useRef<number | null>(null)
  const tunedStringsRef  = useRef<Set<string>>(new Set())
  const centsHistoryRef  = useRef<number[]>([])

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const buffer   = bufferRef.current

    if (!analyser || !buffer) return

    analyser.getFloatTimeDomainData(buffer)

    // Compute RMS for signal level
    let sumSq = 0
    for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i]
    const signalLevel = Math.min(1, Math.sqrt(sumSq / buffer.length) * 10)

    const sampleRate = audioContextRef.current!.sampleRate

    // Use expanded range in chromatic mode
    const pitchOptions = chromaticRef.current
      ? { minFreq: 40, maxFreq: 2000 }
      : { minFreq: 65, maxFreq: 1300 }

    const rawFreq = detectPitch(buffer, sampleRate, pitchOptions)

    if (rawFreq !== null) {
      // Exponential moving average smoothing
      smoothedFreqRef.current =
        smoothedFreqRef.current === null
          ? rawFreq
          : FREQ_SMOOTHING * smoothedFreqRef.current + (1 - FREQ_SMOOTHING) * rawFreq

      const freq = smoothedFreqRef.current
      const { note, octave, cents } = frequencyToNote(freq, a4FreqRef.current)
      const noteKey = `${note}${octave}`

      // Require stable note readings before updating UI
      noteHistoryRef.current.push(noteKey)
      if (noteHistoryRef.current.length > NOTE_STABILITY_FRAMES) {
        noteHistoryRef.current.shift()
      }

      const allSame = noteHistoryRef.current.every(n => n === noteKey)
      const tuningStatus = getTuningStatus(cents)

      // Update cents history
      centsHistoryRef.current = [
        ...centsHistoryRef.current.slice(-(CENTS_HISTORY_SIZE - 1)),
        cents,
      ]

      // Track in-tune hold duration and transitions
      const prevStatus = prevStatusRef.current
      let tuneInCountDelta = 0
      let tunedStringsChanged = false

      if (tuningStatus === 'in-tune') {
        if (prevStatus !== 'in-tune') {
          // Just transitioned into in-tune
          inTuneStartRef.current = Date.now()
          tuneInCountDelta = 1
        } else {
          const elapsed = inTuneStartRef.current
            ? Date.now() - inTuneStartRef.current
            : 0
          if (elapsed >= IN_TUNE_HOLD_MS && !tunedStringsRef.current.has(noteKey)) {
            tunedStringsRef.current.add(noteKey)
            tunedStringsChanged = true
          }
        }
      } else {
        inTuneStartRef.current = null
      }

      prevStatusRef.current = tuningStatus

      if (allSame || noteHistoryRef.current.length < NOTE_STABILITY_FRAMES) {
        setState(prev => ({
          ...prev,
          frequency: Math.round(freq * 10) / 10,
          note,
          octave,
          cents,
          needlePosition: centsToNeedlePosition(cents),
          tuningStatus,
          signalLevel,
          error: null,
          centsHistory: [...centsHistoryRef.current],
          tunedStrings: tunedStringsChanged
            ? new Set(tunedStringsRef.current)
            : prev.tunedStrings,
          tuneInCount: prev.tuneInCount + tuneInCountDelta,
        }))
      } else {
        // Still update needle/frequency during transition
        setState(prev => ({
          ...prev,
          frequency: Math.round(freq * 10) / 10,
          needlePosition: centsToNeedlePosition(cents),
          tuningStatus,
          signalLevel,
          centsHistory: [...centsHistoryRef.current],
          tunedStrings: tunedStringsChanged
            ? new Set(tunedStringsRef.current)
            : prev.tunedStrings,
          tuneInCount: prev.tuneInCount + tuneInCountDelta,
        }))
      }
    } else {
      // No pitch detected – decay signal level, clear history
      centsHistoryRef.current = []
      prevStatusRef.current = 'idle'
      inTuneStartRef.current = null

      setState(prev => ({
        ...prev,
        signalLevel: prev.signalLevel * 0.85,
        tuningStatus: prev.signalLevel < 0.05 ? 'idle' : prev.tuningStatus,
        needlePosition: prev.signalLevel < 0.05 ? 0 : prev.needlePosition,
        centsHistory: [],
      }))
      smoothedFreqRef.current = null
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current     = null
    bufferRef.current       = null
    smoothedFreqRef.current = null
    noteHistoryRef.current  = []
    prevStatusRef.current   = 'idle'
    inTuneStartRef.current  = null
    tunedStringsRef.current = new Set()
    centsHistoryRef.current = []

    setState(() => makeInitialState(a4FreqRef.current, chromaticRef.current))
  }, [])

  const start = useCallback(async () => {
    stop()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      streamRef.current = stream

      const ctx = new AudioContext({ latencyHint: 'interactive' })
      audioContextRef.current = ctx

      const analyser = await createAnalyser(ctx, stream)
      analyserRef.current = analyser
      bufferRef.current   = new Float32Array(analyser.fftSize)

      setState(prev => ({ ...prev, isListening: true, error: null }))

      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      let message = 'Could not access the microphone.'
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError')   message = 'Microphone permission denied. Please allow access and try again.'
        if (err.name === 'NotFoundError')     message = 'No microphone found. Please connect one and try again.'
        if (err.name === 'NotSupportedError') message = 'Your browser does not support audio input.'
      }
      setState(prev => ({ ...prev, error: message, isListening: false }))
    }
  }, [stop, tick])

  const setPreset = useCallback((preset: TuningPreset) => {
    setSelectedPreset(preset)
    // Reset tuned strings when switching preset
    tunedStringsRef.current = new Set()
    setState(prev => ({ ...prev, tunedStrings: new Set() }))
    try { localStorage.setItem(LS_PRESET, preset.name) } catch { /* ignore */ }
  }, [])

  const setA4Frequency = useCallback((freq: number) => {
    const clamped = Math.max(430, Math.min(450, freq))
    a4FreqRef.current = clamped
    setState(prev => ({ ...prev, a4Frequency: clamped }))
    try { localStorage.setItem(LS_A4_FREQ, String(clamped)) } catch { /* ignore */ }
  }, [])

  const setChromaticMode = useCallback((chromatic: boolean) => {
    chromaticRef.current = chromatic
    setState(prev => ({ ...prev, isChromaticMode: chromatic }))
    try { localStorage.setItem(LS_CHROMATIC, String(chromatic)) } catch { /* ignore */ }
  }, [])

  const resetTunedStrings = useCallback(() => {
    tunedStringsRef.current = new Set()
    setState(prev => ({ ...prev, tunedStrings: new Set() }))
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  return {
    ...state,
    start,
    stop,
    selectedPreset,
    setPreset,
    setA4Frequency,
    setChromaticMode,
    resetTunedStrings,
  }
}
