# Guitar — Professional Guitar Tuner

A production-ready, premium guitar tuner web application built with React, TypeScript, and the Web Audio API. Works directly in modern browsers — no app installation required.

## Features

- **Real-time pitch detection** — autocorrelation-based algorithm tuned for guitar frequencies (E2–E4)
- **Visual tuning meter** — animated SVG needle with spring physics, color-coded flat/in-tune/sharp states
- **Note + octave display** — large typography that changes color based on tuning accuracy
- **Frequency + cents readout** — precise Hz and ¢ offset from target pitch
- **Signal level meter** — VU-style bar indicator shows microphone input strength
- **String indicator** — highlights the detected guitar string within the active tuning
- **Multiple tunings** — Standard, Drop D, Half Step Down, Open G, DADGAD
- **Premium dark UI** — glassmorphism panels, gradient accents, soft glow effects
- **Fully responsive** — works seamlessly on desktop, tablet, and mobile
- **No dependencies** — pitch detection uses pure Web Audio API (no external audio libraries)
- **PWA-ready** — mobile meta tags, theme color, apple-mobile-web-app support

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Audio | Web Audio API (native) |
| Fonts | Inter (Google Fonts) |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- A browser with microphone support (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone or download the project
cd guitar

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** Microphone access requires HTTPS in production. In local development, `localhost` is treated as a secure context automatically.

### Building for Production

```bash
npm run build
```

The optimised output is written to `dist/`. Serve it with any static file host.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Vercel

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir dist
```

### Cloudflare Pages / GitHub Pages / Any CDN

Upload the contents of `dist/` to your host of choice. No server-side runtime is required.

> **HTTPS is required** for microphone access outside of localhost. All of the hosts above provide free TLS.

## Project Structure

```
src/
├── components/
│   ├── Tuner.tsx          # Root layout & composition
│   ├── Needle.tsx         # SVG tuning meter with spring animation
│   ├── NoteDisplay.tsx    # Large note + octave + status badge
│   ├── FrequencyDisplay.tsx # Hz and cents readout
│   ├── TuningSelector.tsx # Dropdown for tuning presets
│   ├── StartButton.tsx    # Mic start/stop CTA
│   ├── StringIndicator.tsx # 6-string highlight panel
│   └── SignalMeter.tsx    # VU bar indicator
├── hooks/
│   └── useTuner.ts        # Audio pipeline, state management
├── utils/
│   ├── pitchDetection.ts  # Autocorrelation pitch detection
│   └── noteUtils.ts       # Note math, tuning presets
└── index.css              # Tailwind + custom CSS (glass, glow, animations)
```

## How It Works

1. The user taps **Start Tuner** — the browser prompts for microphone permission.
2. A `MediaStream` is captured with echo cancellation and noise suppression disabled (raw signal is needed for accurate pitch detection).
3. Each animation frame, `AnalyserNode.getFloatTimeDomainData()` fills a 4096-sample PCM buffer.
4. The autocorrelation algorithm finds the fundamental frequency (guitar range: ~65 Hz – 1300 Hz).
5. The detected frequency is converted to the nearest MIDI semitone, note name, octave, and cents offset.
6. Exponential smoothing reduces jitter; a 3-frame stability buffer prevents flickering during string transitions.
7. All visual elements (needle, note color, glow) update in real time via React state.

## Browser Support

| Browser | Support |
|---|---|
| Chrome / Edge 89+ | Full |
| Firefox 90+ | Full |
| Safari 14.1+ | Full |
| Mobile Chrome | Full |
| Mobile Safari | Full |

## License

MIT
