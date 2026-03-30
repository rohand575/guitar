// Standard note names in chromatic scale
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export interface TuningNote {
  note: string
  octave: number
  frequency: number
}

export interface TuningPreset {
  name: string
  strings: TuningNote[]
}

// A4 = 440 Hz reference
const A4_FREQ = 440
const A4_MIDI = 69

/**
 * Convert MIDI note number to frequency in Hz
 */
export function midiToFrequency(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12)
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
 */
export function frequencyToNote(frequency: number): {
  note: string
  octave: number
  cents: number
  targetFrequency: number
} {
  if (!frequency || frequency <= 0) {
    return { note: '-', octave: 0, cents: 0, targetFrequency: 0 }
  }

  // MIDI note (can be fractional)
  const midiFloat = 12 * Math.log2(frequency / A4_FREQ) + A4_MIDI
  const midiRounded = Math.round(midiFloat)

  // Cents offset from the nearest semitone
  const cents = Math.round((midiFloat - midiRounded) * 100)

  const noteIndex = ((midiRounded % 12) + 12) % 12
  const octave = Math.floor(midiRounded / 12) - 1

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
    targetFrequency: midiToFrequency(midiRounded),
  }
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

// ─── Tuning Presets ─────────────────────────────────────────────────────────

function buildString(note: string, octave: number): TuningNote {
  const midi = noteToMidi(note, octave)
  return { note, octave, frequency: midiToFrequency(midi) }
}

function shiftPreset(strings: TuningNote[], semitones: number): TuningNote[] {
  return strings.map(({ note, octave }) => {
    const midi = noteToMidi(note, octave) + semitones
    const newNoteIndex = ((midi % 12) + 12) % 12
    const newOctave = Math.floor(midi / 12) - 1
    return {
      note: NOTE_NAMES[newNoteIndex],
      octave: newOctave,
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
 * Find the closest string in a preset to a detected frequency
 */
export function findClosestString(
  frequency: number,
  preset: TuningPreset,
): TuningNote | null {
  if (!frequency) return null
  return preset.strings.reduce((closest, string) => {
    const diff = Math.abs(frequency - string.frequency)
    const closestDiff = Math.abs(frequency - closest.frequency)
    return diff < closestDiff ? string : closest
  })
}
