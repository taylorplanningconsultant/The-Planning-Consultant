export type ConstraintStatus = "pass" | "flag" | "fail"

export type ConstraintCategory =
  | "conservation_area"
  | "listed_building"
  | "article_4_direction"
  | "flood_zone"
  | "tree_preservation_order"
  | "green_belt"
  | "aonb"
  | "permitted_development"

export interface ConstraintResult {
  category: ConstraintCategory
  label: string
  status: ConstraintStatus
  detail: string
}

export interface LPAInfo {
  lpaName: string
  lpaCode: string
}

export interface ConstraintCheckResponse {
  constraints: ConstraintResult[]
  score: number
  lpa: LPAInfo
  reportId: string
  shareToken: string
}

export interface CheckConstraintsRequest {
  address: string
  postcode: string
}
