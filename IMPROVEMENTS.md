# Guitar Tuner — UI/UX Improvements

This document tracks all planned UI/UX improvements. Each item is marked as **Done**, **Partial**, or **Pending**.

---

## Done

### 1. Tuning Session Progress Tracker
**Files:** `useTuner.ts`, `StringIndicator.tsx`, `Tuner.tsx`

When a string is held in-tune (≤5 cents) for at least 800 ms, it is marked with a green checkmark badge on its circle in the string indicator. A live counter above the circles shows "X / 6 strings in tune". Progress resets on "Stop Tuner" or when switching tuning presets.

---

### 2. Celebratory "In Tune" Micro-animation
**Files:** `NoteDisplay.tsx`, `index.css`, `useTuner.ts`

Each time the tuner transitions *into* in-tune status, the large note character plays a spring-bounce burst animation (`animate-burst` keyframe). On mobile devices, a short haptic vibration (`navigator.vibrate(80)`) fires simultaneously. The animation is driven by a `tuneInCount` counter that increments on every flat/sharp → in-tune transition.

---

### 3. Cents Stability Sparkline
**Files:** `FrequencyDisplay.tsx`, `useTuner.ts`

A 20-bar mini sparkline appears below the Hz / Cents readout while listening. Each bar represents a recent cents reading. Bar height encodes closeness to in-tune (taller = closer). Bar color follows the tuning status: green (in-tune), blue (flat), red (sharp). The buffer is maintained as a rolling 20-frame array in `useTuner.ts` and cleared when no pitch is detected.

---

### 4. Reference Pitch Playback
**Files:** `StringIndicator.tsx`, `noteUtils.ts`

While the tuner is **not** actively listening, each string circle in the indicator is tappable/clickable. Tapping plays a pure sine tone at the string's target frequency for 1.5 seconds with a smooth fade-in and fade-out (via Web Audio API oscillator). The correct frequency is calculated using the current A4 calibration setting. A speaker icon appears on hover to hint at the interaction. The control is disabled while the microphone is active.

---

### 5. A4 Calibration Control
**Files:** `CalibrationControl.tsx` (new), `useTuner.ts`, `noteUtils.ts`, `Tuner.tsx`

A small "A4: 440 Hz" control with − and + buttons appears in the header (right side, below the tuning selector row). The range is 430–450 Hz. Changing the value immediately affects pitch detection accuracy and reference tone playback. The value persists across page reloads via `localStorage` (key: `guitar_tuner_a4`). All `midiToFrequency` calls now accept a configurable `a4Freq` parameter.

---

### 6. Persistent Preferences (localStorage)
**Files:** `useTuner.ts`

Three preferences are now persisted across sessions:
| Key | Value | Default |
|-----|-------|---------|
| `guitar_tuner_preset` | Tuning preset name | `Standard` |
| `guitar_tuner_a4` | A4 reference frequency | `440` |
| `guitar_tuner_chromatic` | Chromatic mode on/off | `false` |

All are read on first mount and written on change.

---

### 7. First-Time Onboarding Tour
**Files:** `Onboarding.tsx` (new), `Tuner.tsx`

On first load (checked via `guitar_tuner_onboarded` in `localStorage`), a modal overlay with 3 steps explains how to use the tuner:
1. Play a string
2. Watch the needle
3. Hit the centre

Dismissed with "Got it, start tuning". Never shown again once dismissed.

---

### 8. Accessibility Improvements
**Files:** `NoteDisplay.tsx`, `TuningSelector.tsx`, `StringIndicator.tsx`

- **Shape-based status cues** — The status badge now shows a directional icon alongside the text: `▼` (ChevronDown) for Flat, `─` (Minus) for In Tune, `▲` (ChevronUp) for Sharp. Color-blind users no longer rely on color alone.
- **`role="status"` + `aria-live="polite"`** — The tuning status badge announces changes to screen readers.
- **Keyboard navigation in TuningSelector** — `ArrowDown`/`ArrowUp` move focus between options, `Enter`/`Space` select, `Escape` closes, `Tab` closes without selecting.
- **`aria-label`** on all icon-only buttons (`CalibrationControl`, `StringIndicator` circles, chromatic toggle).
- **String circles** now have descriptive `aria-label` including note, octave, and tuned state.

---

### 9. Chromatic Mode Toggle
**Files:** `Tuner.tsx`, `useTuner.ts`, `pitchDetection.ts`

A toggle button in the header switches between **Guitar mode** (E2–E4, 65–1300 Hz) and **Chromatic mode** (40–2000 Hz, covers bass guitar). In Chromatic mode:
- The string indicator panel is hidden (no preset matching needed)
- The tuning preset selector is disabled
- The hint text updates to reflect chromatic detection
- Pitch detection uses the expanded frequency range

The mode is indicated by an icon swap (Music2 ↔ Radio) and a violet highlight when active. Persisted to `localStorage`.

---

## Pending

### 10. Custom Tuning Presets
**Priority:** Low

Allow users to define their own 6-string tuning via a modal with note pickers. Saved to `localStorage` as a "Custom" preset entry that appears in the tuning selector. This requires a new `CustomTuningModal.tsx` component and updates to `TuningSelector.tsx` and `noteUtils.ts`.

**Estimated scope:** ~200 lines across 3 files + new modal component.

---

## Notes

- All improvements are non-breaking — the core pitch detection algorithm is unchanged.
- `noteUtils.ts` now exports `DEFAULT_A4_FREQ = 440` and the `midi` field on `TuningNote`, both backwards-compatible additions.
- `pitchDetection.ts` `detectPitch` now accepts an optional `options` object; existing callers without the argument continue to work identically.
