"use client"
import { History, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type DiagnosticSession,
  scoreColor,
} from "@/lib/diagnostic-data"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Small colored dot + number — scannable at a glance without reading the value
function ScorePill({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <span
      className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums"
      style={{
        color,
        backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)`,
      }}
    >
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {score}
    </span>
  )
}

export function SessionSidebar({
  sessions,
  activeId,
  onSelect,
  collapsed,
  onToggleCollapse,
}: {
  sessions: DiagnosticSession[]
  activeId: string | null
  onSelect: (session: DiagnosticSession) => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  if (collapsed) {
    return (
      <aside className="w-full shrink-0 p-3 md:w-56">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center gap-2 rounded-xl border border-border bg-sidebar px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <History className="size-4 shrink-0" />
          <span>Past sessions ({sessions.length})</span>
          <ChevronRight className="ml-auto size-4 shrink-0" />
        </button>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-full shrink-0 flex-col p-3 md:w-72">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-sidebar">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center gap-2 border-b border-border px-4 py-4 text-left transition-colors hover:bg-accent"
          aria-label="Hide past sessions"
        >
          <History className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Past sessions
          </h2>
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {sessions.length}
          </span>
          <ChevronLeft className="size-4 text-muted-foreground" />
        </button>
        <nav className="flex flex-col gap-1 overflow-y-auto p-2">
          {sessions.map((session) => {
            const isActive = session.id === activeId
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelect(session)}
                className={cn(
                  "flex flex-col gap-1.5 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-accent",
                  isActive && "border-border bg-accent",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground" title={session.label}>
                    {session.label}
                  </span>
                  <ScorePill score={session.score} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(session.date)}</span>
                  <span>
                    {session.issues.length} issue
                    {session.issues.length === 1 ? "" : "s"}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}