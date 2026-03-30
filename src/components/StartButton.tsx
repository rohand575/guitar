import React from 'react'
import { Mic, MicOff, Loader } from 'lucide-react'

interface StartButtonProps {
  isListening: boolean
  isLoading?: boolean
  onStart: () => void
  onStop: () => void
}

export const StartButton: React.FC<StartButtonProps> = ({
  isListening,
  isLoading = false,
  onStart,
  onStop,
}) => {
  const handleClick = () => {
    if (isLoading) return
    if (isListening) onStop()
    else onStart()
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isListening ? 'Stop tuner' : 'Start tuner'}
      className={`
        relative flex items-center justify-center gap-3
        px-8 py-4 rounded-2xl
        font-semibold text-base tracking-wide
        btn-press transition-all duration-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
        ${isLoading ? 'cursor-wait opacity-60' : 'cursor-pointer'}
        ${isListening
          ? `
            bg-white/10 text-white/80
            border border-white/15
            hover:bg-white/15 hover:border-white/25 hover:text-white
            shadow-lg shadow-black/40
          `
          : `
            text-white border border-transparent
            shadow-xl shadow-violet-500/30
            hover:shadow-violet-500/50
          `
        }
      `}
      style={
        !isListening && !isLoading
          ? {
              background: 'linear-gradient(135deg, #6c63ff 0%, #a855f7 50%, #ec4899 100%)',
            }
          : undefined
      }
    >
      {/* Pulsing ring for active state */}
      {isListening && (
        <span
          className="absolute inset-0 rounded-2xl border border-red-500/40 animate-pulse-glow pointer-events-none"
        />
      )}

      {/* Icon */}
      {isLoading ? (
        <Loader size={20} className="animate-spin" />
      ) : isListening ? (
        <MicOff size={20} className="text-red-400" />
      ) : (
        <Mic size={20} />
      )}

      {/* Label */}
      <span>
        {isLoading ? 'Connecting…' : isListening ? 'Stop Tuner' : 'Start Tuner'}
      </span>
    </button>
  )
}
