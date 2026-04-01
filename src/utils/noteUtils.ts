// Standard note names in chromatic scale
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export interface TuningNote {
  note: string
  octave: number
  midi: number
  frequency: number  // at DEFAULT_A4_FREQ
}

export interface TuningPreset {
  name: string
  strings: TuningNote[]
}

// Default A4 reference frequency (Hz)
export const DEFAULT_A4_FREQ = 440
const A4_MIDI = 69

/**
 * Convert MIDI note number to frequency in Hz.
 * Accepts an optional a4Freq for non-standard tuning calibration.
 */
export function midiToFrequency(midi: number, a4Freq: number = DEFAULT_A4_FREQ): number {
  return a4Freq * Math.pow(2, (midi - A4_MIDI) / 12)
}

/**
 * Convert note name + octave to MIDI number
 */
export function noteToMidi(note: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(note)
  if (noteIndex === -1) throw new Error(`Invalid note: ${note}`)
  return (octave + 1) * 12 + noteIndex
}

/**
 * Given a frequency in Hz, return:
 * - note name
 * - octave
 * - cents offset from exact pitch (-50 to +50)
 * - the closest exact frequency
 *
 * Accepts an optional a4Freq for calibration (default 440 Hz).
 */
export function frequencyToNote(
  frequency: number,
  a4Freq: number = DEFAULT_A4_FREQ,
): {
  note: string
  octave: number
  cents: number
  targetFrequency: number
} {
  if (!frequency || frequency <= 0) {
    return { note: '-', octave: 0, cents: 0, targetFrequency: 0 }
  }

  // MIDI note (can be fractional)
  const midiFloat = 12 * Math.log2(frequency / a4Freq) + A4_MIDI
  const midiRounded = Math.round(midiFloat)

  // Cents offset from the nearest semitone
  const cents = Math.round((midiFloat - midiRounded) * 100)

  const noteIndex = ((midiRounded % 12) + 12) % 12
  const octave = Math.floor(midiRounded / 12) - 1

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
    targetFrequency: midiToFrequency(midiRounded, a4Freq),
  }
}

/**
 * Compute the cents difference between a detected frequency and a target frequency.
 * Positive = sharp, negative = flat.
 */
export function centsFromFrequency(detected: number, target: number): number {
  if (detected <= 0 || target <= 0) return 0
  return Math.round(1200 * Math.log2(detected / target))
}

/**
 * Returns a clamped percentage (-1 to 1) for the needle position
 * based on cents offset. 50 cents = full deflection.
 */
export function centsToNeedlePosition(cents: number): number {
  return Math.max(-1, Math.min(1, cents / 50))
}

/**
 * Determine tuning status based on cents
 */
export type TuningStatus = 'flat' | 'in-tune' | 'sharp' | 'idle'

export function getTuningStatus(cents: number, threshold = 5): TuningStatus {
  if (Math.abs(cents) <= threshold) return 'in-tune'
  if (cents < 0) return 'flat'
  return 'sharp'
}

/**
 * Play a reference sine tone at the given frequency for a specified duration.
 * Uses a short fade-in and fade-out to avoid clicks.
 */
export function playReferenceTone(frequency: number, duration = 1.5): void {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05)
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime + duration - 0.2)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
    oscillator.onended = () => ctx.close()
  } catch {
    // Ignore – AudioContext unavailable (e.g. insecure context)
  }
}

// ─── Tuning Presets ─────────────────────────────────────────────────────────

function buildString(note: string, octave: number): TuningNote {
  const midi = noteToMidi(note, octave)
  return { note, octave, midi, frequency: midiToFrequency(midi) }
}

function shiftPreset(strings: TuningNote[], semitones: number): TuningNote[] {
  return strings.map(({ note, octave }) => {
    const midi = noteToMidi(note, octave) + semitones
    const newNoteIndex = ((midi % 12) + 12) % 12
    const newOctave = Math.floor(midi / 12) - 1
    return {
      note: NOTE_NAMES[newNoteIndex],
      octave: newOctave,
      midi,
      frequency: midiToFrequency(midi),
    }
  })
}

const STANDARD_STRINGS: TuningNote[] = [
  buildString('E', 2),
  buildString('A', 2),
  buildString('D', 3),
  buildString('G', 3),
  buildString('B', 3),
  buildString('E', 4),
]

export const TUNING_PRESETS: TuningPreset[] = [
  {
    name: 'Standard',
    strings: STANDARD_STRINGS,
  },
  {
    name: 'Drop D',
    strings: [
      buildString('D', 2),
      buildString('A', 2),
      buildString('D', 3),
      buildString('G', 3),
      buildString('B', 3),
      buildString('E', 4),
    ],
  },
  {
    name: 'Half Step Down',
    strings: shiftPreset(STANDARD_STRINGS, -1),
  },
  {
    name: 'Open G',
    strings: [
      buildString('D', 2),
      buildString('G', 2),
      buildString('D', 3),
      buildString('G', 3),
      buildString('B', 3),
      buildString('D', 4),
    ],
  },
  {
    name: 'DADGAD',
    strings: [
      buildString('D', 2),
      buildString('A', 2),
      buildString('D', 3),
      buildString('G', 3),
      buildString('A', 3),
      buildString('D', 4),
    ],
  },
]

/**
 * Find the closest string in a preset to a detected frequency.
 * Uses the current A4 calibration for accurate frequency comparison.
 */
export function findClosestString(
  frequency: number,
  preset: TuningPreset,
  a4Freq: number = DEFAULT_A4_FREQ,
): TuningNote | null {
  if (!frequency) return null
  return preset.strings.reduce((closest, string) => {
    const diff = Math.abs(frequency - midiToFrequency(string.midi, a4Freq))
    const closestDiff = Math.abs(frequency - midiToFrequency(closest.midi, a4Freq))
    return diff < closestDiff ? string : closest
  })
}
