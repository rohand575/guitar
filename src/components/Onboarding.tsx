import React from 'react'
import { Music, Activity, CheckCircle2, X } from 'lucide-react'

interface OnboardingProps {
  onDismiss: () => void
}

const STEPS = [
  {
    icon: Music,
    title: 'Play a string',
    description: 'Pick any string on your guitar and let it ring out clearly',
  },
  {
    icon: Activity,
    title: 'Watch the needle',
    description: 'The needle shows how sharp (right) or flat (left) you are',
  },
  {
    icon: CheckCircle2,
    title: 'Hit the centre',
    description: 'Tune until the needle centres and the note glows green',
  },
]

export const Onboarding: React.FC<OnboardingProps> = ({ onDismiss }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="How to use the tuner"
    >
      <div
        className="
          w-full max-w-sm glass-strong rounded-3xl p-6
          animate-scale-in
          border border-white/10
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">
              How to tune
            </h2>
            <p className="text-white/40 text-sm mt-0.5">
              Three quick steps
            </p>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Close tutorial"
            className="
              w-8 h-8 rounded-xl flex items-center justify-center
              text-white/30 hover:text-white/70
              bg-white/5 hover:bg-white/10
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
            "
          >
            <X size={16} />
          </button>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-4 mb-6">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              {/* Step number + icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6c63ff22, #a855f722)', border: '1px solid rgba(108,99,255,0.3)' }}
              >
                <step.icon size={16} className="text-violet-400" aria-hidden="true" />
              </div>

              <div>
                <p className="text-white/90 text-sm font-semibold">
                  {i + 1}. {step.title}
                </p>
                <p className="text-white/40 text-xs leading-relaxed mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onDismiss}
          className="
            w-full py-3 rounded-2xl
            font-semibold text-sm text-white
            transition-all duration-200 btn-press
            focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
          "
          style={{
            background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
          }}
        >
          Got it, start tuning
        </button>
      </div>
    </div>
  )
}
