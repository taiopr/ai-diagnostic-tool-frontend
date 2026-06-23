"use client"
import { useState, useEffect, useCallback } from "react"
import { Microscope, Loader2, X } from "lucide-react"
import { TopBar } from "@/components/top-bar"
import { SessionSidebar } from "@/components/session-sidebar"
import { DiagnosticForm, type DiagnosticMode } from "@/components/diagnostic-form"
import { ResultsPanel } from "@/components/results-panel"
import { type DiagnosticSession, type DiagnosticIssue } from "@/lib/diagnostic-data"
import {
  runDiagnostic,
  listSessions,
  getStats,
  getSession,
  getErrorMessage,
  type SessionListItem,
  type StatsResponse,
  type SessionDetail,
} from "@/lib/api"

const LOADING_MESSAGES = [
  "Analysing prompt structure...",
  "Checking against failure patterns...",
  "Generating improved version...",
  "Running validation pass...",
]

function placeholderIssues(count: number): DiagnosticIssue[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder-${i}`,
    severity: "low",
    type: "",
    explanation: "",
    fix: "",
  }))
}

function listItemToSession(item: SessionListItem): DiagnosticSession {
  return {
    id: item.session_id,
    label: item.session_label || "Untitled diagnostic",
    date: item.created_at,
    mode: item.input_mode === "n8n_workflow" ? "n8n" : "prompt",
    score: item.score,
    prompt: "",
    testInput: "",
    summary: item.summary,
    issues: placeholderIssues(item.issue_count),
    originalOutput: "",
    improvedOutput: "",
    rewrittenPrompt: "",
  }
}

function sessionDetailToSession(data: SessionDetail): DiagnosticSession {
  return {
    id: data.session_id,
    label: data.session_label || "Untitled diagnostic",
    date: data.created_at,
    mode: data.input_mode === "n8n_workflow" ? "n8n" : "prompt",
    score: data.score ?? 0,
    prompt: data.original_prompt,
    testInput: data.test_input,
    summary: data.summary ?? "",
    issues: data.issues,
    originalOutput: data.original_output ?? "",
    improvedOutput: data.improved_output ?? "Improved output unavailable",
    rewrittenPrompt: data.suggested_prompt ?? "",
  }
}

function deriveLabel(promptText: string): string | null {
  if (!promptText || promptText.trim().length < 10) return null
  const firstLine = promptText
    .split(/\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 5) ?? ""
  const roleMatch = firstLine.match(/^you are an?\s+(.+)/i)
  if (roleMatch) {
    const role = roleMatch[1]
      .replace(/\.$/, "")
      .replace(/\s+who.*/i, "")
      .replace(/\s+that.*/i, "")
      .trim()
    if (role.length > 3)
      return role.charAt(0).toUpperCase() + role.slice(1, 40)
  }
  const cleaned = firstLine.replace(/[{}"[\]]/g, "").trim()
  if (cleaned.length > 5)
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1, 40)
  return null
}

export default function Page() {
  const [sessions, setSessions] = useState<DiagnosticSession[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [active, setActive] = useState<DiagnosticSession | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  // Form state lifted so sessions and "run with fix" can prefill it
  const [formPrompt, setFormPrompt] = useState("")
  const [formTestInput, setFormTestInput] = useState("")
  const [formMode, setFormMode] = useState<DiagnosticMode>("prompt")
  const [formLabel, setFormLabel] = useState("")

  useEffect(() => {
    if (!isRunning) { setLoadingMessageIndex(0); return }
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [isRunning])

  const refreshSidebarAndStats = useCallback(() => {
    listSessions()
      .then((items) => setSessions(items.map(listItemToSession)))
      .catch(console.error)
    getStats().then(setStats).catch(console.error)
  }, [])

  useEffect(() => { refreshSidebarAndStats() }, [refreshSidebarAndStats])

  async function handleSelectSession(session: DiagnosticSession) {
    try {
      const data = await getSession(session.id)
      const full = sessionDetailToSession(data)
      setActive(full)
      // Pre-fill the form so the user can see what was diagnosed and iterate
      setFormPrompt(full.prompt)
      setFormTestInput(full.testInput)
      setFormMode(full.mode)
      setFormLabel(full.label === "Untitled diagnostic" ? "" : full.label)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session")
    }
  }

  async function handleRun(input: {
    prompt: string
    testInput: string
    mode: DiagnosticMode
    label: string
  }) {
    setIsRunning(true)
    setError(null)
    try {
      const data = await runDiagnostic({
        original_prompt: input.prompt,
        test_input: input.testInput,
        input_mode: input.mode === "n8n" ? "n8n_workflow" : "prompt",
        session_label: input.label.trim() || undefined,
      })

      const result: DiagnosticSession = {
        id: data.session_id,
        label: input.label.trim() || "Untitled diagnostic",
        date: new Date().toISOString(),
        mode: input.mode,
        score: data.score,
        prompt: input.prompt,
        testInput: input.testInput,
        summary: data.summary,
        issues: data.issues.map((issue, i) => ({
          ...issue,
          id: `${data.session_id}-issue-${i}`,
        })),
        originalOutput: data.original_output,
        improvedOutput: data.improved_output ?? "Improved output unavailable",
        rewrittenPrompt: data.suggested_prompt,
      }

      setActive(result)
      refreshSidebarAndStats()
    } catch (e) {
      setError(e instanceof Error ? getErrorMessage(e) : "Something went wrong")
    } finally {
      setIsRunning(false)
    }
  }

  // Called from ResultsPanel — loads the suggested fix into the form and runs it
  function handleRunWithFix(rewrittenPrompt: string, testInput: string, mode: DiagnosticMode) {
    const suggestion = deriveLabel(rewrittenPrompt)
    setFormPrompt(rewrittenPrompt)
    setFormTestInput(testInput)
    setFormMode(mode)
    setFormLabel(suggestion ?? "")
    // Small delay so the form visually updates before the run starts
    setTimeout(() => {
      handleRun({
        prompt: rewrittenPrompt,
        testInput,
        mode,
        label: suggestion ?? "",
      })
    }, 80)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar stats={stats} />
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="order-2 shrink-0 md:order-none md:h-full">
          <SessionSidebar
            sessions={sessions}
            activeId={active?.id ?? null}
            onSelect={handleSelectSession}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />
        </div>
        <main className="order-1 flex-1 overflow-y-auto md:order-none">
          <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-2">
            <section className="flex flex-col gap-3">
              <DiagnosticForm
                onRun={handleRun}
                isRunning={isRunning}
                prompt={formPrompt}
                testInput={formTestInput}
                mode={formMode}
                label={formLabel}
                onPromptChange={setFormPrompt}
                onTestInputChange={setFormTestInput}
                onModeChange={setFormMode}
                onLabelChange={setFormLabel}
              />
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </section>
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-end">
                {active && !isRunning && (
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    <X className="size-3" />
                    Clear results
                  </button>
                )}
              </div>
              {isRunning ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    This usually takes 15-30 seconds — two AI calls run in sequence.
                  </p>
                </div>
              ) : active ? (
                <ResultsPanel
                  session={active}
                  onRunWithFix={handleRunWithFix}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/30 p-6 text-center">
                  <Microscope className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Results appear here after running a diagnostic
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}