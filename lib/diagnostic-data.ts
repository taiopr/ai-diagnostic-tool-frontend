export type Severity = "high" | "medium" | "low"

export type DiagnosticIssue = {
  id: string
  severity: Severity
  type: string
  explanation: string
  fix: string
}

export type DiagnosticSession = {
  id: string
  label: string
  date: string
  mode: "prompt" | "n8n"
  score: number
  prompt: string
  testInput: string
  summary: string
  issues: DiagnosticIssue[]
  originalOutput: string
  improvedOutput: string
  rewrittenPrompt: string
}

export const sampleSessions: DiagnosticSession[] = [
  {
    id: "ses_001",
    label: "Support reply generator",
    date: "2026-06-14T09:24:00Z",
    mode: "prompt",
    score: 34,
    prompt:
      "You are a helpful assistant. Answer the customer's question about their order.",
    testInput: "Where is my order #48213? It's been two weeks.",
    summary:
      "Vague role and no constraints lead to inconsistent, off-brand replies that miss key order details.",
    issues: [
      {
        id: "i1",
        severity: "high",
        type: "Missing constraints",
        explanation:
          "The prompt never tells the model the tone, length, or what data it can rely on, so outputs drift wildly between runs.",
        fix: "Specify tone (empathetic, professional), a max length, and that it must ask for the order ID if missing.",
      },
      {
        id: "i2",
        severity: "high",
        type: "No grounding",
        explanation:
          "There is no reference to an order-status data source, so the model hallucinates delivery dates.",
        fix: "Inject order status from your system as context and instruct the model to only use provided data.",
      },
      {
        id: "i3",
        severity: "medium",
        type: "Ambiguous role",
        explanation:
          "'Helpful assistant' is generic and does not anchor the model to your support brand voice.",
        fix: "Define a specific persona, e.g. 'a senior support agent for Acme Logistics'.",
      },
    ],
    originalOutput:
      "Hi! Your order #48213 should arrive soon. Thanks for your patience!",
    improvedOutput:
      "Hi there — I'm sorry for the wait on order #48213. I can see it shipped on June 2 and is currently in transit, with delivery expected by June 16. If it hasn't arrived by then, reply here and I'll open a carrier investigation right away.",
    rewrittenPrompt:
      "You are a senior support agent for Acme Logistics. Using ONLY the order data provided in <order_status>, write an empathetic, professional reply under 120 words. Acknowledge the delay, state the current status and expected delivery date, and offer a concrete next step. If the order ID or status is missing, ask the customer for it instead of guessing.",
  },
  {
    id: "ses_002",
    label: "Lead enrichment workflow",
    date: "2026-06-13T16:10:00Z",
    mode: "n8n",
    score: 58,
    prompt:
      "Extract the company name, industry, and employee count from the website text.",
    testInput: "<scraped homepage text for example.com>",
    summary:
      "Extraction works but lacks an output schema and error handling for missing fields.",
    issues: [
      {
        id: "i1",
        severity: "medium",
        type: "No output schema",
        explanation:
          "Downstream nodes expect JSON but the prompt returns prose, causing parse failures.",
        fix: "Require strict JSON output with a defined key set and types.",
      },
      {
        id: "i2",
        severity: "medium",
        type: "Missing field handling",
        explanation:
          "When employee count is absent the model invents a number.",
        fix: "Instruct it to return null for any field not explicitly found in the text.",
      },
      {
        id: "i3",
        severity: "low",
        type: "No examples",
        explanation:
          "A single example would improve consistency of the industry classification.",
        fix: "Add one few-shot example mapping text to the expected JSON.",
      },
    ],
    originalOutput:
      "The company is Example Inc, in the software industry, with around 200 employees.",
    improvedOutput:
      '{ "company_name": "Example Inc", "industry": "Software", "employee_count": null }',
    rewrittenPrompt:
      'Extract company details from the provided website text. Return ONLY valid JSON matching: { "company_name": string, "industry": string, "employee_count": number | null }. Use null for any field not explicitly stated. Do not infer or estimate. Example: input "We are a 50-person fintech startup" -> { "company_name": null, "industry": "Fintech", "employee_count": 50 }.',
  },
  {
    id: "ses_003",
    label: "Blog outline assistant",
    date: "2026-06-12T11:45:00Z",
    mode: "prompt",
    score: 82,
    prompt:
      "Create a detailed blog post outline for the given topic, with an intro, 4-6 H2 sections, and a conclusion. Audience: marketing managers.",
    testInput: "Topic: How to measure content ROI",
    summary:
      "Strong, well-scoped prompt. Minor gains available from tone and SEO guidance.",
    issues: [
      {
        id: "i1",
        severity: "low",
        type: "Tone unspecified",
        explanation:
          "Audience is defined but tone is not, leading to occasional academic phrasing.",
        fix: "Add a tone directive such as 'practical and conversational'.",
      },
      {
        id: "i2",
        severity: "low",
        type: "No SEO hint",
        explanation:
          "Outline could include a target keyword to improve search relevance.",
        fix: "Ask for one primary keyword woven naturally into H2s.",
      },
    ],
    originalOutput:
      "I. Introduction\nII. Defining Content ROI\nIII. Metrics That Matter\nIV. Tools\nV. Conclusion",
    improvedOutput:
      "Intro: Why content ROI is hard but worth measuring\nH2: What 'content ROI' actually means for your team\nH2: The 5 metrics that map to revenue\nH2: Setting up attribution without a data team\nH2: Tools that do the heavy lifting\nH2: A simple monthly reporting cadence\nConclusion: Turn measurement into a habit",
    rewrittenPrompt:
      "Create a detailed, practical and conversational blog post outline for marketing managers on the given topic. Include an intro hook, 4-6 H2 sections, and a conclusion. Weave the primary keyword naturally into at least two H2 headings. Keep each heading benefit-driven and skimmable.",
  },
]

export function scoreColor(score: number) {
  if (score < 40) return "var(--severity-high)"
  if (score <= 70) return "var(--severity-medium)"
  return "var(--severity-low)"
}

export function severityColor(severity: Severity) {
  if (severity === "high") return "var(--severity-high)"
  if (severity === "medium") return "var(--severity-medium)"
  return "var(--severity-low)"
}
