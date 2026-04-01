/**
 * Pitch detection using autocorrelation (YIN-inspired algorithm)
 * Works without external dependencies via the Web Audio API.
 */

/**
 * Compute the root-mean-square of a float32 buffer.
 * Returns 0–1 (clamped). Used to gate on audio signal level.
 */
export function rms(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i]
  }
  return Math.sqrt(sum / buffer.length)
}

export interface PitchDetectionOptions {
  /** Minimum detectable frequency in Hz (default: 65 Hz, guitar low E) */
  minFreq?: number
  /** Maximum detectable frequency in Hz (default: 1300 Hz, guitar high range) */
  maxFreq?: number
}

/**
 * Autocorrelation-based pitch detection.
 *
 * @param buffer  - PCM float32 samples (mono)
 * @param sampleRate - audio context sample rate (e.g. 44100)
 * @param options - optional frequency range overrides (for chromatic/bass modes)
 * @returns detected frequency in Hz, or null if not confident
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  options?: PitchDetectionOptions,
): number | null {
  const SIZE = buffer.length

  // Gate: ignore very quiet signals (background noise)
  const signal = rms(buffer)
  if (signal < 0.005) return null

  // ── Step 1: Autocorrelation ────────────────────────────────────────────
  const correlations = new Float32Array(SIZE)
  for (let lag = 0; lag < SIZE; lag++) {
    let sum = 0
    for (let i = 0; i < SIZE - lag; i++) {
      sum += buffer[i] * buffer[i + lag]
    }
    correlations[lag] = sum
  }

  // ── Step 2: Find the first dip then the first peak after it ────────────
  // Map frequency range we care about
  const maxFreq = options?.maxFreq ?? 1300
  const minFreq = options?.minFreq ?? 65

  const minLag = Math.floor(sampleRate / maxFreq)
  const maxLag = Math.ceil(sampleRate / minFreq)

  // Find the first "valley" after lag 0
  let valleyEnd = minLag
  while (valleyEnd < maxLag && correlations[valleyEnd] > correlations[valleyEnd + 1]) {
    valleyEnd++
  }

  // Starting from the valley, find the first peak
  let peakLag = valleyEnd
  let peakValue = correlations[valleyEnd]
  for (let lag = valleyEnd; lag <= maxLag; lag++) {
    if (correlations[lag] > peakValue) {
      peakValue = correlations[lag]
      peakLag = lag
    }
  }

  // ── Step 3: Confidence check ───────────────────────────────────────────
  // Reject weak or ambiguous peaks (peak must be at least 30% of lag-0 value)
  const confidence = correlations[peakLag] / correlations[0]
  if (confidence < 0.3) return null

  // ── Step 4: Parabolic interpolation for sub-sample accuracy ───────────
  const prevLag = peakLag > 1 ? peakLag - 1 : peakLag
  const nextLag = peakLag < SIZE - 1 ? peakLag + 1 : peakLag

  const alpha = correlations[prevLag]
  const beta  = correlations[peakLag]
  const gamma = correlations[nextLag]

  let refinedLag = peakLag
  if (alpha !== gamma) {
    refinedLag = peakLag + (alpha - gamma) / (2 * (alpha - 2 * beta + gamma))
  }

  return sampleRate / refinedLag
}

/**
 * Create and return a configured AnalyserNode attached to the microphone stream.
 */
export async function createAnalyser(
  audioContext: AudioContext,
  stream: MediaStream,
): Promise<AnalyserNode> {
  const source = audioContext.createMediaStreamSource(stream)
  const analyser = audioContext.createAnalyser()

  // Larger FFT = better low-frequency resolution at cost of latency
  analyser.fftSize = 4096
  analyser.smoothingTimeConstant = 0.0

  source.connect(analyser)
  return analyser
}
