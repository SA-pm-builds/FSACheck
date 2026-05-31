import { Clock, CheckCircle2, XCircle, AlertCircle, Trash2, Wallet } from "lucide-react"
import type { FSAResult } from "@/types/fsa"
import { cn } from "@/lib/utils"

interface SidebarProps {
  history: FSAResult[]
  onSelect: (result: FSAResult) => void
  onClear: () => void
  selectedId?: string
}

const STATUS_ICONS = {
  eligible: { Icon: CheckCircle2, class: "text-emerald-400" },
  not_eligible: { Icon: XCircle, class: "text-red-400" },
  conditional: { Icon: AlertCircle, class: "text-amber-400" },
  unknown: { Icon: AlertCircle, class: "text-gray-400" },
}

export function Sidebar({ history, onSelect, onClear, selectedId }: SidebarProps) {
  const recentHistory = [...history].reverse()

  return (
    <aside className="flex h-full flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight">FSACheck</h1>
          <p className="text-xs text-[hsl(var(--sidebar-foreground))] opacity-60">Eligibility Lookup</p>
        </div>
      </div>

      {/* History header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 opacity-50" />
          <span className="text-xs font-medium uppercase tracking-wider opacity-50">
            Search History
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs opacity-40 hover:opacity-70 hover:bg-[hsl(var(--sidebar-accent))] transition-all"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-3 pb-4 space-y-1">
        {recentHistory.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--sidebar-accent))]">
              <Clock className="h-5 w-5 opacity-40" />
            </div>
            <p className="text-xs opacity-40 leading-relaxed">
              Your recent searches will appear here
            </p>
          </div>
        ) : (
          recentHistory.map((item) => {
            const statusConfig = STATUS_ICONS[item.status ?? "unknown"]
            const StatusIcon = statusConfig.Icon
            const isSelected = item.id === selectedId
            const isLoading = item.isLoading

            return (
              <button
                key={item.id}
                onClick={() => !isLoading && onSelect(item)}
                className={cn(
                  "group w-full rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                  isSelected
                    ? "bg-[hsl(var(--sidebar-accent))] text-white"
                    : "hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]",
                  isLoading && "cursor-default"
                )}
              >
                <div className="flex items-start gap-2.5">
                  {isLoading ? (
                    <div className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-gray-500 border-t-blue-400" />
                  ) : (
                    <StatusIcon
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        isSelected ? "opacity-100" : "opacity-70",
                        statusConfig.class
                      )}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-xs leading-relaxed line-clamp-2",
                        isSelected ? "text-white opacity-100" : "opacity-80"
                      )}
                    >
                      {item.query}
                    </p>
                    <p className={cn("mt-0.5 text-[10px] opacity-40", isSelected && "opacity-60")}>
                      {item.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[hsl(var(--sidebar-border))] px-5 py-3">
        <p className="text-[10px] opacity-30 leading-relaxed">
          Based on IRS Publication 502
          <br />
          Not financial or medical advice
        </p>
      </div>
    </aside>
  )
}
