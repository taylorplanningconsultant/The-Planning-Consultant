/**
 * Removes AI-appended metadata lines sometimes added at the end of planning
 * statements (e.g. "Generated on January 2025") with an incorrect or
 * training-cutoff date.
 */
export function stripStatementAiFooter(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  while (lines.length > 0) {
    const raw = lines[lines.length - 1] ?? ""
    const line = raw
      .trim()
      .replace(/^\*+/, "")
      .replace(/\*+$/, "")
      .replace(/^_{2,}/, "")
      .replace(/_{2,}$/, "")
      .trim()
    if (line === "") {
      lines.pop()
      continue
    }
    const isFooter =
      /^generated on\b/i.test(line) ||
      /^draft (?:prepared|date|created)\b/i.test(line) ||
      /^document (?:prepared|generated|created)\b/i.test(line) ||
      /^prepared on\b/i.test(line) ||
      /^created on\b/i.test(line)
    if (isFooter) {
      lines.pop()
      continue
    }
    if (line === "---" || line === "***" || line === "___") {
      lines.pop()
      continue
    }
    break
  }
  return lines.join("\n").trimEnd()
}
