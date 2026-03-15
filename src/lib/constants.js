// ─── Evaluation Categories ───────────────────────────────────────
export const EVAL_CATEGORIES = [
  { key: "problem_understanding", label: "Problem Statement Understanding", max: 10 },
  { key: "approach_solution",     label: "Approach / Proposed Solution",    max: 10 },
  { key: "feasibility",           label: "Feasibility",                     max: 10 },
  { key: "impact_innovation",     label: "Impact & Innovation",             max: 10 },
  { key: "research_background",   label: "Research & Background Study",     max: 10 },
];

export const TOTAL_MAX = EVAL_CATEGORIES.reduce((s, c) => s + c.max, 0); // 50

// ─── Tabs Configuration ───────────────────────────────────────────
export const TABS = [
  { key: "teams", label: "Teams" },
  { key: "judges", label: "Judges" },
  { key: "batch", label: "Batch" },
  { key: "results", label: "Results", right: true },
];
