import { AlertTriangle, Info, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { StatusBadge, STATUS_CONFIG } from "@/components/StatusBadge"
import type { FSAResult } from "@/types/fsa"
import { cn } from "@/lib/utils"

interface ResultCardProps {
  result: FSAResult
}

function StreamingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      <div className="streaming-dot h-2 w-2 rounded-full bg-blue-500" />
      <div className="streaming-dot h-2 w-2 rounded-full bg-blue-500" />
      <div className="streaming-dot h-2 w-2 rounded-full bg-blue-500" />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-gray-200" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-4/6 rounded bg-gray-200" />
      </div>
    </div>
  )
}

export function ResultCard({ result }: ResultCardProps) {
  if (result.isLoading && !result.isStreaming) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 text-sm font-medium text-gray-500">{result.query}</div>
        <LoadingSkeleton />
      </div>
    )
  }

  const config = STATUS_CONFIG[result.status ?? "unknown"]
  const StatusIcon =
    result.status === "eligible"
      ? CheckCircle2
      : result.status === "not_eligible"
        ? XCircle
        : AlertCircle

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-sm transition-all duration-300",
        result.status === "eligible" && "border-emerald-200",
        result.status === "not_eligible" && "border-red-200",
        result.status === "conditional" && "border-amber-200",
        (result.status === "unknown" || !result.status) && "border-gray-200"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "rounded-t-2xl px-6 py-4 border-b",
          result.status === "eligible" && "bg-emerald-50 border-emerald-100",
          result.status === "not_eligible" && "bg-red-50 border-red-100",
          result.status === "conditional" && "bg-amber-50 border-amber-100",
          (result.status === "unknown" || !result.status) && "bg-gray-50 border-gray-100"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 leading-relaxed">{result.query}</p>
          {result.status && !result.isStreaming && (
            <div className="shrink-0">
              <StatusBadge status={result.status} size="sm" />
            </div>
          )}
          {result.isStreaming && <StreamingDots />}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        {/* Status indicator + explanation */}
        {result.status && !result.isStreaming && (
          <div className="flex items-start gap-3">
            <StatusIcon
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                config.iconClass
              )}
            />
            <p className="text-sm text-gray-700 leading-relaxed">
              {result.explanation}
            </p>
          </div>
        )}

        {result.isStreaming && (
          <p className="text-sm text-gray-500 italic">Analyzing eligibility...</p>
        )}

        {/* Caveats */}
        {result.caveats && result.caveats.length > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Important Conditions
              </span>
            </div>
            {result.caveats.map((caveat, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <p className="text-sm text-amber-800">{caveat}</p>
              </div>
            ))}
          </div>
        )}

        {/* HSA note */}
        {result.hsaDiffers && result.hsaNote && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                HSA Difference
              </span>
            </div>
            <p className="text-sm text-blue-800">{result.hsaNote}</p>
          </div>
        )}

        {!result.hsaDiffers && result.status && !result.isStreaming && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            <p className="text-xs text-gray-400">HSA rules are the same as FSA for this item</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="rounded-b-2xl border-t border-gray-100 px-6 py-2.5">
        <p className="text-xs text-gray-400">
          {result.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {" · "}
          <span>Powered by Claude AI · Not financial advice</span>
        </p>
      </div>
    </div>
  )
}
