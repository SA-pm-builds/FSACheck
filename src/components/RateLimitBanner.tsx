import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface RateLimitBannerProps {
  msUntilReset: number
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "any moment"
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export function RateLimitBanner({ msUntilReset }: RateLimitBannerProps) {
  const [remaining, setRemaining] = useState(msUntilReset)

  useEffect(() => {
    if (remaining <= 0) return
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [remaining])

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-3.5 shrink-0">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-900">
            You've reached your daily limit of 5 free queries.
          </p>
          <p className="text-xs text-amber-700">
            Come back in 24 hours!
            {remaining > 0 && (
              <span className="ml-1 tabular-nums">
                Resets in <span className="font-medium">{formatCountdown(remaining)}</span>.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
