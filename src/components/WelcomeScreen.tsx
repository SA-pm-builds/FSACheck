import { Sun, Brain, Pill, LampDesk, Smile, Venus, Dumbbell, Eye } from "lucide-react"
import { EXAMPLE_QUERIES } from "@/types/fsa"
import type { LucideIcon } from "lucide-react"

interface WelcomeScreenProps {
  onExampleClick: (query: string) => void
  disabled?: boolean
}

// One icon per query, matched by index to EXAMPLE_QUERIES
const QUERY_ICONS: LucideIcon[] = [
  Sun,       // "Is sunscreen FSA eligible?"
  Brain,     // "Can I use FSA for therapy?"
  Pill,      // "Are vitamins covered by FSA?"
  LampDesk,  // "Is a standing desk FSA eligible?"
  Smile,     // "Does FSA cover dental work?"
  Venus,     // "Are birth control pills FSA eligible?"
  Dumbbell,  // "Can I use FSA for gym membership?"
  Eye,       // "Is LASIK surgery FSA eligible?"
]

export function WelcomeScreen({ onExampleClick, disabled }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
      {/* Hero text */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
          Is it FSA eligible?
        </h2>
        <p className="text-base text-gray-500 max-w-md leading-relaxed">
          Ask anything about FSA or HSA eligibility in plain English.
          Get instant AI-powered answers based on IRS Publication 502.
        </p>
      </div>

      {/* Example queries grid */}
      <div className="w-full max-w-2xl">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-gray-400">
          Try asking about
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_QUERIES.map((query, i) => {
            const Icon = QUERY_ICONS[i]
            return (
              <button
                key={query}
                onClick={() => !disabled && onExampleClick(query)}
                disabled={disabled}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:shadow-sm"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                  <Icon className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <span className="leading-snug">{query}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-10 flex items-center gap-6 text-xs text-gray-400">
        <span>✓ Based on IRS Publication 502</span>
        <span>✓ Updated for 2025</span>
        <span>✓ FSA & HSA rules</span>
      </div>
    </div>
  )
}
