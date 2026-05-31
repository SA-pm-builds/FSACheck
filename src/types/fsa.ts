export type EligibilityStatus = "eligible" | "not_eligible" | "conditional" | "unknown"

export interface FSAResult {
  id: string
  query: string
  timestamp: Date
  status: EligibilityStatus
  explanation: string
  caveats: string[]
  hsaDiffers: boolean
  hsaNote?: string
  isLoading?: boolean
  isStreaming?: boolean
}

export const EXAMPLE_QUERIES = [
  "Is sunscreen FSA eligible?",
  "Can I use FSA for therapy?",
  "Are vitamins covered by FSA?",
  "Is a standing desk FSA eligible?",
  "Does FSA cover dental work?",
  "Are birth control pills FSA eligible?",
  "Can I use FSA for gym membership?",
  "Is LASIK surgery FSA eligible?",
]
