// ─── Evaluation Categories ───────────────────────────────────────
// lib/evalCategories.js

export const EVAL_CATEGORIES = [
  {
    key: "introduction",
    label: "Introduction",
    description: "Clarity of background, problem statement, and motivation",
    max: 10,
    subcriteria: [
      { label: "Comprehensive clarity of background context and environmental overview relevant to the project domain", max: 2.5 },
      { label: "Clear articulation and rigorous justification of the problem statement, including substantiation of why the project was undertaken", max: 2.5 },
      { label: "Demonstrated relevance and significance of the identified problem within the broader context of the chosen domain", max: 2.5 },
      { label: "Explicit delineation of project scope boundaries and articulation of underlying motivation and rationale", max: 2.5 },
    ],
  },
  {
    key: "objectives",
    label: "Objectives",
    description: "Clarity and feasibility of stated objectives",
    max: 10,
    subcriteria: [
      { label: "Clear and precise articulation of project objectives with measurable targets and well-defined success criteria", max: 2.5 },
      { label: "Strong alignment and traceability between stated objectives and the clearly defined problem statement", max: 2.5 },
      { label: "Demonstrated relevance of proposed objectives to the intended solution and expected outcomes", max: 2.5 },
      { label: "Substantiated feasibility and realistic achievability of objectives within the constraints of available resources and timeline", max: 2.5 },
    ],
  },
  {
    key: "implementation",
    label: "Implementation",
    description: "Effectiveness and technical soundness of the proposed solution",
    max: 10,
    subcriteria: [
      { label: "Successful development of a fully functional system, computational model, or working prototype demonstrating core functionality", max: 2.5 },
      { label: "Technical correctness, soundness of architecture, and robust implementation of proposed algorithmic or system design principles", max: 2.5 },
      { label: "Judicious and appropriate selection of tools, technologies, frameworks, and methodologies for the project domain", max: 2.5 },
      { label: "Clear, comprehensive, and effective demonstration of the implemented system with attention to usability and functionality", max: 2.5 },
    ],
  },
  {
    key: "results",
    label: "Results / Evaluation",
    description: "Quality and significance of results, including validation and data analysis",
    max: 10,
    subcriteria: [
      { label: "Clear, well-organized, and logically structured presentation of results, outputs, and findings in accessible formats", max: 2.5 },
      { label: "Adequacy, relevance, and rigor of employed testing methodologies and validation approaches for result verification", max: 2.5 },
      { label: "Comprehensive utilization of quantifiable data, performance metrics, meaningful statistics, and performance indicators in analysis", max: 2.5 },
      { label: "Substantive demonstration of how obtained results directly support, validate, and reinforce the stated project objectives", max: 2.5 },
    ],
  },
  {
    key: "implication",
    label: "Implication",
    description: "Potential impact and real-world applicability of the solution",
    max: 10,
    subcriteria: [
      { label: "Strong practical applicability and demonstrated real-world relevance of the proposed solution within its intended operational context", max: 2.5 },
      { label: "Well-articulated potential impact across technical, societal, economic, or environmental dimensions with clear justification", max: 2.5 },
      { label: "Demonstrated scalability and adaptability of the proposed solution to diverse use cases, environments, and future requirements", max: 2.5 },
      { label: "Thoughtful identification of expanded future scope, potential enhancements, and opportunities for further development and improvement", max: 2.5 },
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
