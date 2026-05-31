import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { EligibilityStatus } from "@/types/fsa"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: EligibilityStatus
  size?: "sm" | "lg"
}

const STATUS_CONFIG = {
  eligible: {
    label: "FSA Eligible",
    icon: CheckCircle2,
    badgeVariant: "eligible" as const,
    iconClass: "text-emerald-600",
    bgClass: "bg-emerald-50 border-emerald-200",
    textClass: "text-emerald-800",
  },
  not_eligible: {
    label: "Not Eligible",
    icon: XCircle,
    badgeVariant: "not_eligible" as const,
    iconClass: "text-red-500",
    bgClass: "bg-red-50 border-red-200",
    textClass: "text-red-800",
  },
  conditional: {
    label: "Conditionally Eligible",
    icon: AlertCircle,
    badgeVariant: "conditional" as const,
    iconClass: "text-amber-500",
    bgClass: "bg-amber-50 border-amber-200",
    textClass: "text-amber-800",
  },
  unknown: {
    label: "Unknown",
    icon: HelpCircle,
    badgeVariant: "unknown" as const,
    iconClass: "text-gray-500",
    bgClass: "bg-gray-50 border-gray-200",
    textClass: "text-gray-700",
  },
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  if (size === "lg") {
    return (
      <div className={cn("inline-flex items-center gap-2 rounded-lg border px-4 py-2", config.bgClass)}>
        <Icon className={cn("shrink-0", config.iconClass, "w-5 h-5")} />
        <span className={cn("font-semibold text-base", config.textClass)}>{config.label}</span>
      </div>
    )
  }

  return (
    <Badge variant={config.badgeVariant} className="gap-1.5 py-1">
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  )
}

export { STATUS_CONFIG }
