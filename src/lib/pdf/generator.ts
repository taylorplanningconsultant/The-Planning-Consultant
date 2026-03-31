import type { ConstraintResult } from "@/types/planning"

export interface ReportData {
  address: string
  postcode: string
  lpaName: string
  score: number
  constraints: ConstraintResult[]
  generatedAt: string
}

export { generateReportPDF } from "./generator-document"
