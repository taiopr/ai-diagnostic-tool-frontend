"use client"

import { History } from "lucide-react"
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

export function SessionSidebar({
  sessions,
  activeId,
  onSelect,
}: {
  sessions: DiagnosticSession[]
  activeId: string | null
  onSelect: (session: DiagnosticSession) => void
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-border bg-sidebar md:w-72 md:border-r">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <History className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Past sessions</h2>
        <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {sessions.length}
        </span>
      </div>
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
                <span className="truncate text-sm font-medium text-foreground">
                  {session.label}
                </span>
                <span
                  className="rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums"
                  style={{
                    color: scoreColor(session.score),
                    backgroundColor: `color-mix(in oklch, ${scoreColor(session.score)} 16%, transparent)`,
                  }}
                >
                  {session.score}
                </span>
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
    </aside>
  )
}
