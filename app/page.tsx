"use client"
import { useState, useEffect, useCallback } from "react"
import { Microscope, Loader2 } from "lucide-react"
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

export default function Page() {
  const [sessions, setSessions] = useState<DiagnosticSession[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [active, setActive] = useState<DiagnosticSession | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  useEffect(() => {
    if (!isRunning) {
      setLoadingMessageIndex(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [isRunning])

  const refreshSidebarAndStats = useCallback(() => {
    listSessions()
      .then((items) => setSessions(items.map(listItemToSession)))
      .catch(console.error)
    getStats()
      .then(setStats)
      .catch(console.error)
  }, [])

  useEffect(() => {
    refreshSidebarAndStats()
  }, [refreshSidebarAndStats])

  async function handleSelectSession(session: DiagnosticSession) {
    try {
      const data = await getSession(session.id)
      setActive(sessionDetailToSession(data))
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

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar stats={stats} />
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="order-2 shrink-0 md:order-none">
          <SessionSidebar
            sessions={sessions}
            activeId={active?.id ?? null}
            onSelect={handleSelectSession}
          />
        </div>
        <main className="order-1 flex-1 overflow-y-auto md:order-none">
          <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-2">
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                New diagnostic
              </h2>
              <DiagnosticForm onRun={handleRun} isRunning={isRunning} />
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-foreground">Results</h2>
              {isRunning ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    This usually takes 15-30 seconds — two AI calls run in sequence.
                  </p>
                </div>
              ) : active ? (
                <ResultsPanel session={active} />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Microscope className="size-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No diagnostic selected
                  </p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Run a new diagnostic or pick a past session from the sidebar
                    to see results here.
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
