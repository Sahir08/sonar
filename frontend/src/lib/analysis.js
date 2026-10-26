// Helpers for ANALYSIS results (upload and Nightscout).

/** Explanation for moment i: the latest moment's explanation, or an alert start's. Null otherwise. */
export function analysisExplanation(analysis, i) {
  if (!analysis || i === null || i === undefined) return null
  if (analysis.latest?.index === i && analysis.latest.explanation) return analysis.latest.explanation
  return analysis.explanations?.[String(i)] ?? null
}

/** Index of the latest reading, falling back to the last row. */
export function latestIndex(analysis) {
  const i = analysis?.latest?.index
  return Number.isInteger(i) ? i : Math.max(0, (analysis?.time?.length ?? 1) - 1)
}
