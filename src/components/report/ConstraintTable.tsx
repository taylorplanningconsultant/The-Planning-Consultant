import {
  Building,
  Circle,
  Droplets,
  FileWarning,
  Home,
  Mountain,
  TreePine,
  Trees,
  type LucideIcon,
} from "lucide-react"
import type { ConstraintCategory, ConstraintResult } from "@/types/planning"
import { cn } from "@/utils/cn"

const CONSTRAINT_ICONS: Record<ConstraintCategory, LucideIcon> = {
  conservation_area: Trees,
  listed_building: Building,
  article_4_direction: FileWarning,
  flood_zone: Droplets,
  tree_preservation_order: TreePine,
  green_belt: Circle,
  aonb: Mountain,
  permitted_development: Home,
}

function ConstraintCategoryIcon({ category }: { category: ConstraintCategory }) {
  const Icon = CONSTRAINT_ICONS[category]
  return (
    <Icon className="w-4 h-4 text-muted-foreground" aria-hidden />
  )
}

export type ConstraintTableProps = {
  constraints: ConstraintResult[]
  /** How many constraint rows to show before locked placeholders. Defaults to 8. */
  visibleCount?: number
  /**
   * When `visibleCount` is omitted: `false` shows 3 rows (legacy preview).
   * `true` or omitted shows all constraints (up to 8).
   */
  showAll?: boolean
}

function statusLabel(status: ConstraintResult["status"]): string {
  switch (status) {
    case "pass":
      return "Clear"
    case "flag":
      return "Review"
    case "fail":
      return "Restricted"
    default:
      return ""
  }
}

function ConstraintRow({
  constraint,
  neutralStatusDot,
}: {
  constraint: ConstraintResult
  /** Use on blurred “locked” rows so pass/flag/fail colours do not show through the blur. */
  neutralStatusDot?: boolean
}) {
  const { status } = constraint
  return (
    <div className="grid grid-cols-[20px_20px_1fr_auto] items-start gap-4 py-4">
      {neutralStatusDot ? (
        <div className="w-2.5 h-2.5 rounded-full bg-border flex-shrink-0 mt-1.5" />
      ) : (
        <div
          className={cn(
            "mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full",
            status === "pass" && "bg-accent",
            status === "flag" && "bg-amber",
            status === "fail" && "bg-danger",
          )}
        />
      )}
      <div className="ct-emoji mt-1.5 flex flex-shrink-0 justify-center">
        <ConstraintCategoryIcon category={constraint.category} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {constraint.label}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {constraint.detail}
        </p>
      </div>
      <span
        className={cn(
          "whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
          status === "pass" && "bg-[#EDFAF3] text-[#0F7040]",
          status === "flag" && "bg-[#FEF7E6] text-[#8A6010]",
          status === "fail" && "bg-[#FDECEA] text-[#991818]",
        )}
      >
        {statusLabel(status)}
      </span>
    </div>
  )
}

function resolveVisibleCount(
  visibleCount: number | undefined,
  showAll: boolean | undefined,
): number {
  if (typeof visibleCount === "number") return visibleCount
  if (showAll === false) return 3
  return 8
}

export function ConstraintTable({
  constraints,
  visibleCount: visibleCountProp,
  showAll,
}: ConstraintTableProps) {
  const visibleCount = resolveVisibleCount(visibleCountProp, showAll)
  const shown = constraints.slice(0, visibleCount)
  const hiddenConstraints = constraints.slice(visibleCount)

  return (
    <div className="flex flex-col">
      {shown.map((constraint, i) => (
        <div
          key={constraint.category}
          className={cn(
            "border-b border-border",
            hiddenConstraints.length === 0 && i === shown.length - 1 && "border-b-0",
          )}
        >
          <ConstraintRow constraint={constraint} />
        </div>
      ))}
      {hiddenConstraints.map((constraint, i) => (
        <div
          key={constraint.category}
          className={cn(
            "border-b border-border",
            i === hiddenConstraints.length - 1 && "border-b-0",
          )}
        >
          <div className="pointer-events-none select-none blur-sm">
            <ConstraintRow constraint={constraint} neutralStatusDot />
          </div>
        </div>
      ))}
    </div>
  )
}
