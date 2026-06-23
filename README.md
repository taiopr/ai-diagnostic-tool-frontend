# AI Integration Diagnostic Tool — Frontend

Next.js frontend for the [AI Diagnostic Tool API](https://github.com/taiopar/ai-diagnostic-tool). Paste a prompt you're using with ChatGPT, Claude, or any AI assistant — get a score, the specific problems, and a rewritten version that fixes them.

**Live demo:** [ai-diagnostic-tool-frontend.vercel.app](https://ai-diagnostic-tool-frontend.vercel.app)
**Backend repo:** [ai-diagnostic-tool](https://github.com/taiopar/ai-diagnostic-tool)

---

## What it does

The form accepts a prompt (the instructions you give an AI assistant) and an example message (what a user would type to that assistant). On submission, it calls the backend API, which runs two sequential Claude API calls and returns a structured diagnosis. The UI surfaces the result as a scored verdict, a suggested rewrite, an output comparison, and a collapsible list of specific issues.

Past sessions are persisted via the backend and visible in the sidebar. Selecting a past session pre-fills the form with the original prompt for iteration.

---

## UI design decisions

**Score gauge.** The verdict card uses an SVG donut gauge rather than a plain number badge. The gauge communicates quality at a glance — color, fill level, and a one-word label (Critical / Fair / Good / Great) — before the user reads a word. The ring animates in on result load.

**Score-derived card tint.** The verdict card's background and border use `color-mix()` at low opacity to tint the card with the score color. Red for critical prompts, green for well-structured ones. Reinforces the gauge signal without requiring the user to read the number.

**Results hierarchy.** The results panel is ordered by actionability, not by information density: score and summary first (verdict), suggested fix second (the answer), output comparison and issues last (supporting evidence). A user who just wants to use the fix can do so without scrolling past a list of problems.

**Suggested fix as scrollable container.** The rewritten prompt is shown in a fixed-height scrollable box with an inline copy icon pinned to the top-right corner of the container. The icon stays visible as the user scrolls through a long prompt — the same pattern used in code block UIs. A sticky header row containing a labeled "Copy prompt" button provides a second copy affordance from anywhere on the page.

**Run with fix.** A button below the suggested fix loads the rewritten prompt directly into the form and triggers a new diagnostic. This closes the iteration loop: bad prompt → diagnosis → fix → re-diagnose — without copy-pasting.

**Pre-fill from past session.** Selecting a past session from the sidebar pre-fills the form with that session's original prompt and example message. The user can edit and re-run immediately.

**Auto-label.** When the prompt field loses focus, the session label field is auto-filled from the first sentence of the prompt. Heuristic: extracts the role name from "You are a [role]..." patterns and stops at the first sentence boundary. Falls back to the first line, trimmed to 36 characters at the last complete word boundary. Overridable by the user at any point.

**Validation hints.** The form gates submission on real backend minimums (prompt ≥ 10 characters, example message ≥ 3 characters). Hints appear per-field only once the sibling field is already valid — at that point, the current field is the sole remaining blocker, so staying silent would hide the reason the button is disabled.

**n8n Workflow mode.** A type toggle switches between Prompt and n8n Workflow diagnosis modes. For non-technical users unfamiliar with n8n, a note reads: "n8n Workflow is for automation builders — if that's unfamiliar, Prompt covers any AI assistant." The toggle changes which demo examples are shown.

---

## Features

- Donut gauge with animated ring, score label, and color-derived card tint
- Suggested fix in scrollable container with pinned copy icon and sticky header
- "Run with fix" — loads the rewrite into the form and triggers a new diagnostic
- "Show full prompt" / "Collapse" toggle on the suggested fix
- Output comparison (original vs improved, collapsed by default)
- Issues list (collapsed by default, each issue individually expandable)
- Pre-fill form from past session
- Auto-label session from prompt content
- Per-field validation hints that surface only when relevant
- Ctrl+Enter keyboard shortcut to submit
- Past sessions sidebar with colored score dots and collapsible toggle
- Mobile-tested (Safari iOS)
- Keyboard shortcut hint hidden on mobile

---

## Demo examples

The form ships with five built-in examples — three for Prompt mode, two for n8n Workflow mode — visible as chips under "Try an example." Examples are filtered by the currently selected type. Each example loads both the prompt and the example message together. The session label auto-fills from the prompt content.

| Example | Mode | Expected score |
|---------|------|----------------|
| Vague customer support prompt | Prompt | Low (critical) |
| Well-structured sentiment classifier | Prompt | High |
| Educational explainer prompt | Prompt | Medium-high |
| n8n workflow with no error handling | n8n Workflow | Low (critical) |
| Well-structured n8n ticket classifier | n8n Workflow | High |

---

## Setup

### Prerequisites
- Node.js 18+
- The backend API running locally or deployed (see [backend repo](https://github.com/taiopar/ai-diagnostic-tool))

### Install

```bash
git clone https://github.com/taiopr/ai-diagnostic-tool-frontend
cd ai-diagnostic-tool-frontend
npm install
```

### Environment variables
Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_KEY=your-api-key-here
```

For production (Vercel), set these in the project's Environment Variables settings.

### Run

```bash
npm run dev
```

App available at `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

---

## Deployment

Deployed on Vercel. Each push to `master` triggers an automatic redeploy.

The backend is deployed on Railway (Hobby plan). The frontend reads `NEXT_PUBLIC_API_URL` at build time — update this environment variable in Vercel's project settings to point to the Railway deployment URL.

---

## Known Limitations

**Response time.** The backend makes two sequential Claude API calls per diagnostic. Expect 15–30 seconds. A loading state with cycling status messages ("Analysing prompt structure...", "Generating improved version...") is shown during this time.

**Session label truncation.** Auto-generated labels are trimmed to 36 characters at the last complete word boundary. Labels longer than the sidebar column width are truncated with an ellipsis; hovering shows the full label as a native tooltip.

**Past session data quality.** Sessions run before auto-labeling was implemented are labelled "Untitled diagnostic." These cannot be retroactively renamed without a backend migration.

**Scope: reusable system prompts, not one-off requests.** This tool diagnoses prompts designed to handle variable future input, not complete self-contained requests. A request like "explain the theory of relativity in simple terms" is best reframed as a reusable educator system prompt before diagnosing — see the "Educational explainer prompt" demo example. The backend README covers this in detail.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Icons | Lucide React |
| Deployment | Vercel |
| Generated with | v0.dev (initial scaffold) |