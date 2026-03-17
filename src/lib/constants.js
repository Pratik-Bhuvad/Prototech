// ─── Evaluation Categories ───────────────────────────────────────
// lib/evalCategories.js

export const EVAL_CATEGORIES = [
  {
    key: "problem_understanding",
    label: "Problem Statement Understanding",
    description: "Clarity in identifying and defining the real-world problem",
    max: 10,
    subcriteria: [
      { label: "The team clearly identifies and defines the real-world problem", max: 3 },
      { label: "Explanation of the background, environment, or domain where the problem exists", max: 2 },
      { label: "Justification of why the problem is important to solve", max: 2 },
      { label: "The problem is explained in a clear and understandable manner in both abstract and video", max: 3 },
    ],
  },
  {
    key: "approach_solution",
    label: "Approach / Proposed Solution",
    description: "Creativity and technical depth of proposed solution",
    max: 15,
    subcriteria: [
      { label: "Novelty and creativity of the proposed solution", max: 4 },
      { label: "Technical soundness and architecture clarity", max: 4 },
      { label: "Comparison with existing solutions / alternatives considered", max: 3 },
      { label: "Clear explanation of how the solution addresses the problem", max: 4 },
    ],
  },
  {
    key: "feasibility",
    label: "Feasibility",
    description: "Practicality considering technology, cost, and implementation",
    max: 10,
    subcriteria: [
      { label: "Technical feasibility with available tools and skills", max: 3 },
      { label: "Cost and resource considerations", max: 3 },
      { label: "Implementation timeline is realistic", max: 2 },
      { label: "Risks identified and mitigation planned", max: 2 },
    ],
  },
  {
    key: "impact_innovation",
    label: "Impact & Innovation",
    description: "Potential societal, economic, or environmental impact",
    max: 10,
    subcriteria: [
      { label: "Scale of impact — how many people or systems it affects", max: 3 },
      { label: "Innovation factor — how different it is from current solutions", max: 4 },
      { label: "Sustainability and long-term viability", max: 3 },
    ],
  },
  {
    key: "research_background",
    label: "Research & Background Study",
    description: "Depth of research and understanding of the problem domain",
    max: 10,
    subcriteria: [
      { label: "References to existing literature, data, or case studies", max: 3 },
      { label: "Understanding of the domain and stakeholders", max: 4 },
      { label: "Evidence-based reasoning supporting the approach", max: 3 },
    ],
  },
  {
    key: "presentation",
    label: "Presentation",
    description: "Clarity, structure, and quality of delivery",
    max: 5,
    subcriteria: [
      { label: "Clarity and structure of the presentation", max: 2 },
      { label: "Confidence and communication of the team", max: 2 },
      { label: "Quality of supporting materials (slides, demo, video)", max: 1 },
    ],
  },
];

export const TOTAL_MAX = EVAL_CATEGORIES.reduce((s, c) => s + c.max, 0); // 60

// ─── Tabs Configuration ───────────────────────────────────────────
export const TABS = [
  { key: "teams", label: "Teams" },
  { key: "judges", label: "Judges" },
  { key: "batch", label: "Batch" },
  { key: "notifications", label: "Notifications" },
  { key: "results", label: "Results", right: true },
];
