import type { ConstraintResult } from "@/types/planning"

export function calculateApprovalScore(
  constraints: ConstraintResult[],
): number {
  let score = 85

  for (const c of constraints) {
    if (c.status === "fail") {
      if (c.category === "conservation_area") score -= 25
      else if (c.category === "listed_building") score -= 30
      else if (c.category === "green_belt") score -= 30
      else if (c.category === "aonb") score -= 20
    } else if (c.status === "flag") {
      if (c.category === "article_4_direction") score -= 10
      else if (c.category === "flood_zone") score -= 8
      else if (c.category === "tree_preservation_order") score -= 7
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}
