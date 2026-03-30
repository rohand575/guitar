import { useState, useRef, useCallback, useEffect } from 'react'
import { detectPitch, createAnalyser } from '../utils/pitchDetection'
import {
  frequencyToNote,
  centsToNeedlePosition,
  getTuningStatus,
  TUNING_PRESETS,
  type TuningStatus,
  type TuningPreset,
} from '../utils/noteUtils'

export interface TunerState {
  isListening: boolean
  frequency: number | null
  note: string
  octave: number
  cents: number
  needlePosition: number  // -1 (full flat) to +1 (full sharp)
  tuningStatus: TuningStatus
  error: string | null
  signalLevel: number     // 0–1, for VU meter / visual feedback
}

export interface UseTunerReturn extends TunerState {
  start: () => Promise<void>
  stop: () => void
  selectedPreset: TuningPreset
  setPreset: (preset: TuningPreset) => void
}

const INITIAL_STATE: TunerState = {
  isListening: false,
  frequency: null,
  note: '-',
  octave: 0,
  cents: 0,
  needlePosition: 0,
  tuningStatus: 'idle',
  error: null,
  signalLevel: 0,
}

// Smoothing factor for frequency readings (0 = no smoothing, 1 = never updates)
const FREQ_SMOOTHING = 0.6
// How many consecutive similar readings to require before committing a note change
const NOTE_STABILITY_FRAMES = 3

export function useTuner(): UseTunerReturn {
  const [state, setState] = useState<TunerState>(INITIAL_STATE)
  const [selectedPreset, setSelectedPreset] = useState<TuningPreset>(TUNING_PRESETS[0])

  // Refs for audio pipeline (not part of React state – no re-renders on audio updates)
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

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const buffer   = bufferRef.current

    if (!analyser || !buffer) return

    analyser.getFloatTimeDomainData(buffer)

    // Compute RMS for signal level
    let sumSq = 0
    for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i]
    const signalLevel = Math.min(1, Math.sqrt(sumSq / buffer.length) * 10)

    const sampleRate   = audioContextRef.current!.sampleRate
    const rawFreq      = detectPitch(buffer, sampleRate)

    if (rawFreq !== null) {
      // Exponential moving average smoothing
      smoothedFreqRef.current =
        smoothedFreqRef.current === null
          ? rawFreq
          : FREQ_SMOOTHING * smoothedFreqRef.current + (1 - FREQ_SMOOTHING) * rawFreq

      const freq = smoothedFreqRef.current
      const { note, octave, cents } = frequencyToNote(freq)
      const noteKey = `${note}${octave}`

      // Require stable note readings before updating UI
      noteHistoryRef.current.push(noteKey)
      if (noteHistoryRef.current.length > NOTE_STABILITY_FRAMES) {
        noteHistoryRef.current.shift()
      }

      const allSame = noteHistoryRef.current.every(n => n === noteKey)

      if (allSame || noteHistoryRef.current.length < NOTE_STABILITY_FRAMES) {
        setState(prev => ({
          ...prev,
          frequency: Math.round(freq * 10) / 10,
          note,
          octave,
          cents,
          needlePosition: centsToNeedlePosition(cents),
          tuningStatus: getTuningStatus(cents),
          signalLevel,
          error: null,
        }))
      } else {
        // Still update needle/frequency during transition
        setState(prev => ({
          ...prev,
          frequency: Math.round(freq * 10) / 10,
          needlePosition: centsToNeedlePosition(cents),
          tuningStatus: getTuningStatus(cents),
          signalLevel,
        }))
      }
    } else {
      // No pitch detected – decay signal level
      setState(prev => ({
        ...prev,
        signalLevel: prev.signalLevel * 0.85,
        tuningStatus: prev.signalLevel < 0.05 ? 'idle' : prev.tuningStatus,
        needlePosition: prev.signalLevel < 0.05 ? 0 : prev.needlePosition,
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

    analyserRef.current = null
    bufferRef.current   = null
    smoothedFreqRef.current = null
    noteHistoryRef.current  = []

    setState({ ...INITIAL_STATE })
  }, [])

  const start = useCallback(async () => {
    // Stop any existing session first
    stop()

    try {
      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      streamRef.current = stream

      // Set up Web Audio
      const ctx = new AudioContext({ latencyHint: 'interactive' })
      audioContextRef.current = ctx

      const analyser = await createAnalyser(ctx, stream)
      analyserRef.current = analyser
      bufferRef.current   = new Float32Array(analyser.fftSize)

      setState(prev => ({ ...prev, isListening: true, error: null }))

      // Begin processing loop
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      let message = 'Could not access the microphone.'
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError')  message = 'Microphone permission denied. Please allow access and try again.'
        if (err.name === 'NotFoundError')    message = 'No microphone found. Please connect one and try again.'
        if (err.name === 'NotSupportedError') message = 'Your browser does not support audio input.'
      }
      setState(prev => ({ ...prev, error: message, isListening: false }))
    }
  }, [stop, tick])

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
    setPreset: setSelectedPreset,
  }
}
