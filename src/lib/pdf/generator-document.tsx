import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"
import type { ConstraintStatus } from "@/types/planning"
import type { ReportData } from "./generator"

declare module "./generator" {
  interface ReportData {
    ai_assessment?: string
  }
}

const brandDark = "#0B4D2C"
const brandBright = "#18A056"
const textPrimary = "#0A0F0C"
const textSecondary = "#4A5C50"
const border = "#E2E8E3"

type MarkdownElementType = "h2" | "h3" | "p" | "bullet"

type MarkdownElement = {
  type: MarkdownElementType
  text: string
}

function parseMarkdown(text: string): MarkdownElement[] {
  const lines = text.split("\n")
  const elements: MarkdownElement[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith("## ")) {
      elements.push({ type: "h2", text: trimmed.replace("## ", "") })
    } else if (trimmed.startsWith("### ")) {
      elements.push({ type: "h3", text: trimmed.replace("### ", "") })
    } else if (trimmed.startsWith("# ")) {
      elements.push({ type: "h2", text: trimmed.replace("# ", "") })
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push({ type: "bullet", text: trimmed.replace(/^[-*] /, "") })
    } else if (/^\d+\. /.test(trimmed)) {
      elements.push({ type: "bullet", text: trimmed.replace(/^\d+\. /, "") })
    } else {
      elements.push({ type: "p", text: trimmed.replace(/\*\*/g, "") })
    }
  }

  return elements
}

const statusStyles: Record<
  ConstraintStatus,
  { bg: string; color: string; label: string }
> = {
  pass: { bg: "#EDFAF3", color: "#0F7040", label: "Pass" },
  flag: { bg: "#FEF7E6", color: "#8A6010", label: "Flag" },
  fail: { bg: "#FDECEA", color: "#991818", label: "Fail" },
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 40,
    color: textPrimary,
  },
  headerBar: {
    backgroundColor: brandDark,
    marginHorizontal: -40,
    marginTop: -48,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#FFFFFF",
    fontSize: 9,
    opacity: 0.9,
  },
  sectionLabel: {
    color: brandBright,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  headline: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: textPrimary,
    marginBottom: 8,
  },
  body: {
    fontSize: 10,
    color: textSecondary,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  scoreCard: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "#F7F9F7",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  scoreNumber: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: brandBright,
  },
  scoreSuffix: {
    fontSize: 14,
    color: textSecondary,
  },
  table: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F0F4F1",
    borderBottomWidth: 1,
    borderBottomColor: border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  colConstraint: { width: "32%" },
  colStatus: { width: "18%" },
  colDetail: { width: "50%" },
  th: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: brandDark,
    textTransform: "uppercase",
  },
  td: {
    fontSize: 9,
    color: textSecondary,
    lineHeight: 1.4,
  },
  tdTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: textPrimary,
    marginBottom: 2,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  nextStepsList: {
    marginTop: 4,
  },
  nextStepItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: brandBright,
  },
  nextStepText: {
    flex: 1,
    fontSize: 10,
    color: textSecondary,
    lineHeight: 1.45,
  },
  aiAssessmentH2: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: textPrimary,
    marginTop: 16,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: border,
    paddingBottom: 4,
  },
  aiAssessmentH3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  aiAssessmentParagraph: {
    fontSize: 10,
    color: textSecondary,
    lineHeight: 1.6,
    marginBottom: 6,
  },
  aiAssessmentBullet: {
    fontSize: 10,
    color: textSecondary,
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: border,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerBrand: {
    fontSize: 8,
    color: brandDark,
    fontFamily: "Helvetica-Bold",
  },
  footerMeta: {
    fontSize: 8,
    color: textSecondary,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
})

function StatusBadge({ status }: { status: ConstraintStatus }) {
  const s = statusStyles[status]
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
    </View>
  )
}

function ReportDocument({ data }: { data: ReportData }) {
  const nextSteps = [
    "Use this report as a starting point — it is not formal planning advice.",
    "Discuss any flagged or failed items with a qualified planning consultant or your architect.",
    "Consider a pre-application enquiry with your local planning authority for site-specific guidance.",
    "Gather supporting documents (drawings, surveys) before submitting any application.",
  ]

  return (
    <Document
      title="Planning constraints report"
      author="MyPlanningGuide"
      subject="Planning approval likelihood report"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Planning report</Text>
          <Text style={styles.headerSubtitle}>MyPlanningGuide</Text>
        </View>

        <Text style={styles.sectionLabel}>Site</Text>
        <Text style={styles.headline}>Property details</Text>
        <Text style={styles.body}>{data.address}</Text>
        <Text style={styles.body}>{data.postcode}</Text>
        <Text style={[styles.body, { marginBottom: 20 }]}>
          Local planning authority: {data.lpaName}
        </Text>

        <Text style={styles.sectionLabel}>Assessment</Text>
        <Text style={styles.headline}>Approval likelihood score</Text>
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>{data.score}</Text>
            <Text style={styles.scoreSuffix}>/ 100</Text>
          </View>
          <Text style={[styles.body, { marginTop: 8, marginBottom: 0 }]}>
            This score reflects automated checks against common planning
            constraints. It does not guarantee how an application will be
            decided.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Constraints</Text>
        <Text style={styles.headline}>Constraint checks</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colConstraint}>
              <Text style={styles.th}>Constraint</Text>
            </View>
            <View style={styles.colStatus}>
              <Text style={styles.th}>Status</Text>
            </View>
            <View style={styles.colDetail}>
              <Text style={styles.th}>Detail</Text>
            </View>
          </View>
          {data.constraints.map((c, i) => (
            <View
              key={`${c.category}-${i}`}
              style={[
                styles.tableRow,
                i === data.constraints.length - 1 ? styles.tableRowLast : {},
              ]}
            >
              <View style={styles.colConstraint}>
                <Text style={styles.tdTitle}>{c.label}</Text>
              </View>
              <View style={styles.colStatus}>
                <StatusBadge status={c.status} />
              </View>
              <View style={styles.colDetail}>
                <Text style={styles.td}>{c.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {data.ai_assessment ? (
          <>
            <Text style={styles.sectionLabel}>Assessment</Text>
            <Text style={styles.headline}>AI Planning Assessment</Text>
            {parseMarkdown(data.ai_assessment).map((element, index) => {
              if (element.type === "h2") {
                return (
                  <Text key={index} style={styles.aiAssessmentH2}>
                    {element.text}
                  </Text>
                )
              }

              if (element.type === "h3") {
                return (
                  <Text key={index} style={styles.aiAssessmentH3}>
                    {element.text}
                  </Text>
                )
              }

              if (element.type === "bullet") {
                return (
                  <Text key={index} style={styles.aiAssessmentBullet}>
                    {"\u2022 "}
                    {element.text}
                  </Text>
                )
              }

              return (
                <Text key={index} style={styles.aiAssessmentParagraph}>
                  {element.text}
                </Text>
              )
            })}
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Guidance</Text>
        <Text style={styles.headline}>Next steps</Text>
        <View style={styles.nextStepsList}>
          {nextSteps.map((step, i) => (
            <View key={i} style={styles.nextStepItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.nextStepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>MyPlanningGuide</Text>
          <View style={styles.footerRight}>
            <Text style={styles.footerMeta}>
              Generated {data.generatedAt}
              {"  ·  "}
            </Text>
            <Text
              style={styles.footerMeta}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  return renderToBuffer(<ReportDocument data={data} />)
}
